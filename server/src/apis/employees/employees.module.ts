import { forwardRef, Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    DatabaseModule,
    ConfigModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
