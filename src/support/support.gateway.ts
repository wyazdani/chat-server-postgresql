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
@WebSocketGateway({ namespace: '/support' })
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

  @SubscribeMessage('msgToAdmin')
  public async adminMessage(client: Socket, payload: any): Promise<void> {
    const ticketMessage = {
      user_id: payload.user_id,
      ticket_id: payload.ticket_id,
      message: payload.message,
      role: RoleEnum.USER,
      attachment: payload.attachment,
    };
    console.log(ticketMessage);
    const message = await this.httpService.axiosRef.post( `${appConfig().backendDomain}/system-supports/message`,ticketMessage, {
      headers: {
        Authorization: payload.token
      }
    } );
    //const message = await this.supportService.addMessage(ticketMessage);
    this.wss.emit('msgSupport', message.data.data);
  }

  @SubscribeMessage('msgToUser')
  public async userMessage(client: Socket, payload: any): Promise<void> {
    const ticketMessage = {
      user_id: payload.user_id,
      ticket_id: payload.ticket_id,
      message: payload.message,
      role: RoleEnum.ADMIN,
      attachment: payload.attachment,
    };
    const message = await this.httpService.axiosRef.post( `${appConfig().backendDomain}/system-supports/message`,ticketMessage, {
      headers: {
        Authorization: payload.token
      }
    } );
    this.wss.emit('msgSupport', message.data.data);
  }
}
