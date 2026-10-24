export class OfficeError extends Error {
  constructor(status,message){super(message);this.status=status;}
}
