export class RoomInfo {
  public UserMessages = [];
  private _roomID: string;

  constructor(room) {
    this._roomID = room;
    this.UserMessages = [];
  }

  get RoomID(): string {
    return this._roomID;
  }
}
