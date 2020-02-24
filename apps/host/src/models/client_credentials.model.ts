import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ClientCredentialSchema = new Schema({
  id: String,
  expiresAt: Date,
  payload: new Schema({
    iat: Number,
    exp: Number,
    accountId: String,
    claims: new Schema({
      rejected: Array
    }),
    expiresWithSession: Boolean,
    grantId: String,
    gty: String,
    scope: String,
    sessionUid: String,
    kind: String,
    jti: String,
    clientId: String
  })
});

export default mongoose.model(
  'client_credentials',
  ClientCredentialSchema,
  'client_credentials'
);
