import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe());
  app.use(
    bodyParser.json({
      verify: (req, res, buffer) => (req['rawBody'] = buffer),
    }),
  );

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
}
bootstrap();
