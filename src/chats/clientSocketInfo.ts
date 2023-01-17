export class ClientSocketInfo {
  public UserMessages = '';
  private _clientID: string;
  private _roomID: string;
  private _userID: string;

  constructor(client, room, userid) {
    this._clientID = client;
    this._roomID = room;
    this._userID = userid;
  }

  get ClientID(): string {
    return this._clientID;
  }

  get RoomID(): string {
    return this._roomID;
  }

  get UserID(): string {
    return this._userID;
  }
}
