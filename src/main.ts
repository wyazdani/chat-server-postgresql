import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import {Logger} from "@nestjs/common";

async function bootstrap() {
//const app = await NestFactory.create(AppModule);
//const app = await NestFactory.create(AppModule, { cors: true });
const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

  const port = process.env.PORT || 3000;

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    next();
  });

  app.useStaticAssets(join(__dirname, '..', 'test'));

  await app.listen(port, () => {
    Logger.log('------');
    console.log();
    console.log(`App running at     http://localhost:${port}`);
    console.log();
    Logger.log('------');
  });
}
bootstrap();
