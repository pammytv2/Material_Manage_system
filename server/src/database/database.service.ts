

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as sql from 'mssql';
import { ConfigService } from '@nestjs/config';
import { databaseName } from './constant/database';

@Injectable()
export class DatabaseService {
    async query(sqlQuery: string, params?: any[]): Promise<any[]> {
    const pool = await this.getConnection();
    const request = pool.request();
    
    // Set timeout for individual request (60 seconds)
    request.timeout = 60000;
    
    if (params) {
      params.forEach((param) => {
        request.input(param.name, param.type, param.value);
      });
    }
    const result = await request.query(sqlQuery);
    return result.recordset;
  }

  public async executeStoredProcedure<T>(
    database: string,
    procedureName: string,
    params?: { [key: string]: any },
  ): Promise<T[]> {
    let pool: sql.ConnectionPool;
    try {
      pool = await this.getConnection();
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

      // ตรวจสอบว่าเป็นปัญหาเกี่ยวกับการเชื่อมต่อหรือไม่
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

  [x: string]: any;
  constructor(private readonly configService: ConfigService) {}
  async getConnection(): Promise<sql.ConnectionPool> {
    const config: sql.config = {
      server: this.configService.get<string>('DATABASE_SERVER'),
      user: this.configService.get<string>('DATABASE_USER'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      port: parseInt(this.configService.get<string>('DATABASE_PORT') || '1433', 10),
      database: this.configService.get<string>('DATABASE_NAME') || 'MMSystem',
      connectionTimeout: 30000, // 30 seconds connection timeout
      requestTimeout: 60000, // 60 seconds request timeout (เพิ่มจาก 15 วินาที)
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    };
    return await new sql.ConnectionPool(config).connect();
  }
}
