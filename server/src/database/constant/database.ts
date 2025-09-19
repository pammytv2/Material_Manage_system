import { ConfigService } from '@nestjs/config';

export const databaseName = (): string => {
  const configService = new ConfigService();
  return configService.get<string>('DATABASE_NAME') || 'MMSystem';
};
