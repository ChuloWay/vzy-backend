import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import { GlobalExceptionFilter } from './utils/global.exception.filter';
import { LoggerService } from './logger/logger.service';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(morgan('tiny'));

  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe());

  // Set the global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(LoggerService)));

  app.use(
    bodyParser.json({
      verify: (req, res, buffer) => (req['rawBody'] = buffer),
    }),
  );

  app.enableCors();

  const loggerService = app.get(LoggerService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  loggerService.log(`Vzy Backend API is listening on: localhost:${port} 🚀🚀`, 'Main');
}

bootstrap().catch(error => {
  const loggerService = new LoggerService();
  loggerService.error('Error during bootstrapping:', error);
  process.exit(1);
});
