import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
dotenv.config();
async function bootstrap() {
  const logger = new Logger('Main');

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(morgan('tiny'));

  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe());
  
  app.use(
    bodyParser.json({
      verify: (req, res, buffer) => (req['rawBody'] = buffer),
    }),
  );

  app.enableCors();

  await app
    .listen(configService.get<number>('PORT') || 3000)
    .then(() => logger.log(`Vzy Backend API is listening on: localhost: ${configService.get<number>('PORT') || 3000} 🚀🚀`))
    .catch((err) => {
      logger.error('>>> App error: ', err);
    });
}
bootstrap();
