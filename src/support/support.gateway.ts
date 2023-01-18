import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {HttpService} from "@nestjs/axios";
import appConfig from "../config/app.config";

export enum RoleEnum {
  SUPER_ADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'user',
}
@WebSocketGateway({ allowEIO3:true })
export class SupportGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;
  private logger: Logger = new Logger('SupportGateway');

  constructor(private httpService: HttpService) {}

  afterInit(server: Server) {
    this.logger.log('Initialized SupportGateway!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
