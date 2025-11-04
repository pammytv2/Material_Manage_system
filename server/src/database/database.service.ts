//  ----- 📖 Library 📖 -----
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as sql from 'mssql';
import { ConfigService } from '@nestjs/config';

//  ----- 🔐 constant 🔐 -----
import { databaseName } from './constant/database';

//  ----- ➕ Interfaces ➕ -----
import { JwtPayloadData } from 'shared/interfaces/lsd-system-center/auth.interface';

@Injectable()
export class DatabaseService {
  //  💪 constructor function
  constructor(private readonly configService: ConfigService) {}

  private readonly databaseName = databaseName();
  private readonly logger = new Logger(DatabaseService.name);
  private pools: Map<string, sql.ConnectionPool> = new Map();

  public getDatabaseName() {
    return this.databaseName;
  }

  //  Get Database Connection By PresetName
  private databaseConfiguration = (database: string): sql.config => {
    // กำหนด default config สำหรับฐานข้อมูลทั่วไป
    const defaultConfig: sql.config = {
      server: this.configService.get<string>('DATABASE_SERVER') || 'localhost',
      user: this.configService.get<string>('DATABASE_USER'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      port: parseInt(
        this.configService.get<string>('DATABASE_PORT') || '1433',
        10,
      ),
      database,
      connectionTimeout: 30000,
      requestTimeout: 60000,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName:
          this.configService.get<string>('INSTANCE_NAME') || undefined,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    // กำหนด config พิเศษสำหรับ zkbiotime
    const authConfig: sql.config = {
      server:
        this.configService.get<string>('DATABASE_AUTH_SERVER') || 'localhost',
      user: this.configService.get<string>('DATABASE_AUTH_USER'),
      password: this.configService.get<string>('DATABASE_AUTH_PASSWORD'),
      port: parseInt(
        this.configService.get<string>('DATABASE_AUTH_PORT') || '1433',
        10,
      ),
      database,
      connectionTimeout: 30000,
      requestTimeout: 60000,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName:
          this.configService.get<string>('INSTANCE_AUTH_NAME') || undefined,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    return database === 'LSD_SYSTEM_CENTER' ? authConfig : defaultConfig;
  };

  // Make getConnection public and add overload for backward compatibility
  public async getConnection(): Promise<sql.ConnectionPool>;
  public async getConnection(database?: string): Promise<sql.ConnectionPool>;
  public async getConnection(database?: string): Promise<sql.ConnectionPool> {
    const dbName = database || this.databaseName;
    
    try {
      let pool = this.pools.get(dbName);

      if (pool && pool.connected) {
        return pool;
      }

      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          this.logger.warn(`Error closing stale connection: ${closeError.message}`);
        }
        this.pools.delete(dbName);
      }

      const config: sql.config = this.databaseConfiguration(dbName);
      pool = await new sql.ConnectionPool(config).connect();
      
      pool.on('error', (err) => {
        this.logger.error(`Pool error for database ${dbName}:`, err);
        this.pools.delete(dbName);
      });

      this.pools.set(dbName, pool);
      return pool;
    } catch (error) {
      this.logger.error(`Database connection error for ${dbName}:`, error);
      throw new InternalServerErrorException('Failed to connect to database');
    }
  }

  // Method เก่าสำหรับ backward compatibility
  async query(sqlQuery: string, params?: any[]): Promise<any[]>;
  // Method ใหม่ที่รองรับหลายฐานข้อมูล
  async query<T>(database: string, sql: string, values?: (string | number)[]): Promise<T>;
  // Implementation
  async query<T>(
    databaseOrSqlQuery: string,
    sqlOrParams?: string | any[],
    values?: (string | number)[]
  ): Promise<T | any[]> {
    let database: string;
    let sqlQuery: string;
    let params: any[] | (string | number)[] | undefined;

    // ตรวจสอบว่าเรียกใช้แบบเก่าหรือใหม่
    if (typeof sqlOrParams === 'string') {
      // แบบใหม่: query(database, sql, values)
      database = databaseOrSqlQuery;
      sqlQuery = sqlOrParams;
      params = values;
    } else {
      // แบบเก่า: query(sqlQuery, params)
      database = this.databaseName;
      sqlQuery = databaseOrSqlQuery;
      params = sqlOrParams;
    }

    const pool = await this.getConnection(database);
    const request = pool.request();
    
    request.timeout = 60000;
    
    if (params) {
      if (Array.isArray(params) && params.length > 0 && typeof params[0] === 'object' && params[0].name) {
        // แบบเก่า: params = [{ name, type, value }]
        params.forEach((param: any) => {
          request.input(param.name, param.type, param.value);
        });
      } else {
        // แบบใหม่: params = [value1, value2, ...]
        params.forEach((value, index) => {
          request.input(`param${index}`, value);
        });
      }
    }

    try {
      const result = await request.query(sqlQuery);
      return result.recordset;
    } catch (error) {
      this.logger.error(`Query Error for database ${database}:`, error);
      
      if (
        error.code === 'ESOCKET' ||
        error.code === 'ETIMEOUT' ||
        error.code === 'ECONNRESET'
      ) {
        this.logger.warn(`Connection issue detected, removing pool for ${database}`);
        this.pools.delete(database);
      }
      
      throw new InternalServerErrorException(error.message);
    }
  }

  public async executeStoredProcedure<T>(
    database: string,
    procedureName: string,
    params?: { [key: string]: any },
  ): Promise<T[]> {
    let pool: sql.ConnectionPool;
    try {
      pool = await this.getConnection(database);
      const request = pool.request();
      if (params) {
        Object.keys(params).forEach((key) => {
          request.input(key, params[key]);
        });
      }
      const result = await request.execute(procedureName);
      return result.recordsets as T[];
    } catch (error) {
      this.logger.error(
        `Stored Procedure Error for database ${database}:`,
        error,
      );

      if (
        error.code === 'ESOCKET' ||
        error.code === 'ETIMEOUT' ||
        error.code === 'ECONNRESET'
      ) {
        this.logger.warn(
          `Connection issue detected, removing pool for ${database}`,
        );
        this.pools.delete(database);
      }

      throw new InternalServerErrorException('Procedure Execution Failed');
    }
  }

  private async TxLog(sqlquery: string): Promise<void> {
    try {
      const pool = await this.getConnection(this.databaseName);
      const { UserID } = global.jwtPayload as JwtPayloadData;
      const request = pool.request();
      const sqlLog = `
        INSERT INTO [dbo].[log_execute] ([SQL_Query], [Execute_By], [Execute_At])
        VALUES (@param0, @param1, GETDATE());
      `;
      request.input('param0', sqlquery.trim());
      request.input('param1', UserID || 'Unknown');
      await request.query(sqlLog);
    } catch (error) {
      this.logger.error('Failed to log query', error);
      throw new InternalServerErrorException('Logging Error');
    }
  }

  public replaceParams<T>(query: string, values: T[]): string {
    return query.replace(/@param\d+/g, (match) => {
      const paramIndex = parseInt(match.replace('@param', ''), 10);
      return paramIndex < values.length ? `'${values[paramIndex]}'` : match;
    });
  }
}