import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { HttpService } from '@nestjs/axios';
import { map, tap } from 'rxjs/operators';
import axios from 'axios';
import appConfig from '../config/app.config';
import {RoomInfo} from "./roomInfo";
import {ClientSocketInfo} from "./clientSocketInfo";
import {RoleEnum} from "../support/support.gateway";


@WebSocketGateway({ allowEIO3:true, cors:true })
export class SocketsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
//  export class ChatsGateway {
  @WebSocketServer() wss: Server;
  private lstClients = [];
  private lstRooms = [];
  private logger: Logger = new Logger('SocketsGateway');
  public chatId = '';

  constructor(private httpService: HttpService) {}

  afterInit(server: Server) {
    this.logger.log('Initialized SocketsGateway!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const room = this.getRoomOfClient(client);
    if (room != '') {
      this.leaveRoom(client, room);
    }
  }

  @SubscribeMessage('connect_users')
  async connect(client: Socket, payload: any): Promise<void> {

    const data = { recipient_id: payload.receiver_id };
    const room = await this.httpService.axiosRef.post( `${appConfig().backendDomain}/messages/create-room`,data, {
      headers: {
        Authorization: payload.token
      }
    }  );
    const roomId = room.data.data;
    this.logger.log(`Connect Conversation ` + roomId);
    this.addClient(client, payload.sender_id, roomId);
    this.joinRoom(client, roomId);
  }

  @SubscribeMessage('msgToServer')
  async handleMessage(client: Socket, payload: any) {
    const curDate = new Date();
    const _message = {
      message: payload.message,
      msSent: 1,
      date: curDate,
      attachment: payload?.attachment,
      token: payload.token
    };
    const room = this.getRoomOfClient(client);
    this.logger.log(`Client Room ` + room);
    const message = await this.addMessage(_message, room);
    this.wss.to(room).emit('msgToClient', message);
  }

  @SubscribeMessage('joinRoom')
  public joinRoom(client: Socket, room: string): void {
    this.logger.log('joinRoom : ' + room);
    client.join(room);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('leaveRoom')
  public leaveRoom(client: Socket, room: string): void {
    this.logger.log(`leaveRoom`);
    client.leave(room);
    client.emit('leftRoom', room);
    this.deleteClient(client);

    this.saveMessage(room);
  }

  addClient(client: Socket, sender_id: string, room: string) {
    const c = new ClientSocketInfo(client.id, room, sender_id);
    this.lstClients.push(c);

    const objRoom = this.lstRooms.find((o) => o.RoomID === room);
    if (objRoom === undefined) {
      const rm = new RoomInfo(room);
      rm.UserMessages = [];
      this.lstRooms.push(rm);
    }
  }

  deleteClient(client: Socket) {
    for (let i = 0; i < this.lstClients.length; i++) {
      if (this.lstClients[i]['ClientID'] === client.id) {
        this.lstClients.splice(i, 1);
        break;
      }
    }
  }

  getRoomOfClient(client: Socket): string {

    let res = '';
    const objClient = this.lstClients.find((o) => o.ClientID === client.id);
    console.log(objClient);
    if (objClient != undefined) {
      res = objClient.RoomID;
    }
    return res;
  }

  async saveMessage(roomID: string) {
    this.logger.log('saveMessage:' + roomID);
    const objRoom = this.lstRooms.find((o) => o.RoomID === roomID);
    if (objRoom != undefined) {
      if (objRoom.UserMessages.length > 0) {
        const payload = objRoom.UserMessages[0];
        objRoom.UserMessages = [];
        const data = { user_id: payload.user_id, room_id: roomID, message: payload.message, attachment: payload.attachment};
        const messageResponse = await this.httpService.axiosRef.post( `${appConfig().backendDomain}/messages/create`,data, {
          headers: {
            Authorization: payload.token
          }
        } );
        return messageResponse.data.data;
      }
    }
  }

  async addMessage(UserMessage: any, clientRoom: string) {
    const objRoom = this.lstRooms.find((o) => o.RoomID === clientRoom);
    if (objRoom === undefined) {
      const rm = new RoomInfo(clientRoom);
      rm.UserMessages.push(UserMessage);
      this.lstRooms.push(rm);
      return await this.saveMessage(clientRoom);
    } else {
      objRoom.UserMessages.push(UserMessage);
      return await this.saveMessage(clientRoom);
    }
  }

  @SubscribeMessage('msgToAdmin')
  public async adminMessage(client: Socket, payload: any): Promise<void> {
    const ticketMessage = {
      ticket_id: payload.ticket_id,
      message: payload.message,
      role: RoleEnum.ADMIN,
      attachment: payload?.attachment,
    };
    const message = await this.httpService.axiosRef.post( `${appConfig().backendDomain}/system-supports/message`,ticketMessage, {
      headers: {
        Authorization: payload.token
      }
    } );

    //const message = await this.supportService.addMessage(ticketMessage);
    this.wss.emit('msgSupport', message.data);
  }

  @SubscribeMessage('msgToUser')
  public async userMessage(client: Socket, payload: any): Promise<void> {
    const ticketMessage = {
      ticket_id: payload.ticket_id,
      message: payload.message,
      role: RoleEnum.USER,
      attachment: payload?.attachment,
    };
    const message = await this.httpService.axiosRef.post( `${appConfig().backendDomain}/system-supports/message`,ticketMessage, {
      headers: {
        Authorization: payload.token
      }
    } );

    this.wss.emit('msgSupport', message.data);
  }

}
