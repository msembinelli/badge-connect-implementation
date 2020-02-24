import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

interface IConsentDoc extends mongoose.Document {
  Data: {
    ConsentId: string;
    Status: string;
    StatusUpdateDateTime: Date;
    CreationDateTime: Date;
    Permissions: string[];
    ExpirationDateTime: Date;
    TransactionFromDateTime: Date;
    TransactionToDateTime: Date;
  };
  Risk: object;
}

const ConsentSchema = new Schema(
  {
    Data: {
      ConsentId: String,
      Status: String,
      StatusUpdateDateTime: Date,
      CreationDateTime: Date,
      Permissions: [String],
      ExpirationDateTime: Date,
      TransactionFromDateTime: Date,
      TransactionToDateTime: Date
    },
    Risk: Object
  },
  {
    timestamps: false
  }
);

export default mongoose.model<IConsentDoc>('Consent', ConsentSchema);
