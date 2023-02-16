export class SupportClientSocketInfo {
  public UserMessages = '';
  private _clientID: string;
  private _ticketId: string;

  constructor(client, ticket) {
    this._clientID = client;
    this._ticketId = ticket;
  }

  get ClientID(): string {
    return this._clientID;
  }

  get TicketID(): string {
    return this._ticketId;
  }

}
