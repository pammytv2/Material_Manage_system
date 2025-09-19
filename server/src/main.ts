import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{cors: true});
  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('MMSystem API')
    .setDescription('API documentation for MMSystem')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.APP_PORT ?? 3000);
  console.log(`Server running on port ${process.env.APP_PORT ?? 3000}`);

}
bootstrap();
