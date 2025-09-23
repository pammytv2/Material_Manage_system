

import { Injectable } from '@nestjs/common';
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
