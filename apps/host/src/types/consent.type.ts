export interface IConsent {
  ConsentId: string;
  Status: string;
  StatusUpdateDateTime: Date;
  CreationDateTime: Date;
  Permissions: string[];
  ExpirationDateTime: Date;
  TransactionFromDateTime: Date;
  TransactionToDateTime: Date;
}

export interface IRisk {}
