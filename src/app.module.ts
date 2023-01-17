import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatsGateway } from './chats/chats.gateway';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import {SupportGateway} from "./support/support.gateway";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    HttpModule.register({
    timeout: 5000,
    maxRedirects: 5,
  }),],
  controllers: [AppController],
  providers: [AppService,  ChatsGateway, SupportGateway],

})
export class AppModule {}
