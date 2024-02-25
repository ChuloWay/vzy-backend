import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import { GlobalExceptionFilter } from './utils/global.exception.filter';
import { LoggerService } from './logger/logger.service';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  Sentry.init({
    dsn: configService.get<string>('SENTRY_DNS'),
    integrations: [new ProfilingIntegration()],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  });

  app.setGlobalPrefix('api/v1');
  app.use(morgan('tiny'));

  app.useGlobalPipes(new ValidationPipe({ stopAtFirstError: true, whitelist: true }));

  // Set the global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(new LoggerService()));


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

bootstrap().catch((error) => {
  const loggerService = new LoggerService();
  loggerService.error('Error during bootstrapping:', error);
  process.exit(1);
});
