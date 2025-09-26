import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MaterialReceiveModule } from './apis/material_receive/material_receive.module';
import { ManageMatModule } from './manage_mat/manage_mat.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DATABASE_SERVER || 'localhost',
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true, // เปลี่ยนเป็น true เฉพาะตอน dev
      options: {
        encrypt: false,
      },
    }),
     MaterialReceiveModule,
     ManageMatModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}