import { saveDB } from '../utils/mongo';
import { Request } from 'express';
import { Issuer, generators, custom } from 'openid-client';

custom.setHttpOptionsDefaults({
  timeout: 5000000000
});

export const register = async (req: Request, res, next) => {
  // tslint:disable-next-line:object-literal-sort-keys

  try {
    const { url } = req.query;

    // generate the code challenge
    const code_verifier = generators.codeVerifier();
    const state = generators.state();
    const code_challenge = generators.codeChallenge(code_verifier);
    console.log(code_challenge, code_verifier, state);

    // get the wellKnown from the host
    const issuer = await Issuer.discover(url);

    // binding the needed parameters for registration from the badge connect manifest
    issuer.jwks_uri = process.env.JWKS_ENDPOINT;
    issuer.token_endpoint = issuer.badgeConnectAPI[0].tokenUrl;
    issuer.authorization_endpoint = issuer.badgeConnectAPI[0].authorizationUrl;
    issuer.registration_endpoint = issuer.badgeConnectAPI[0].registrationUrl;
    issuer.issuer = issuer.badgeConnectAPI[0].apiBase;

    // generate the state and internal id for the host
    const [{ insertedId: id }] = await Promise.all([
      saveDB(issuer, 'wellKnows'),
      saveDB({ code_verifier, code_challenge, state }, 'state')
    ]);

    const redirect_uri = `${req.secure ? 'https' : 'http'}://${
      req.headers.host
    }/callback/${id}`;

    // TODO report typing error
    const Client: any = issuer.Client;
    // register the client
    const client = await Client.register({
      ...issuer.metadata,
      redirect_uris: [redirect_uri],
      software_id: process.env.SOFTWARE_ID,
      software_version: process.env.SOFTWARE_VERSION,
      tos_uri: process.env.TOS_URI,
      policy_uri: process.env.POLICY_URI,
      logo_uri: process.env.LOGO_URI,
      client_uri: process.env.CLIENT_URI,
      client_name: process.env.CLIENT_NAME

      // application_type: 'web',
      // token_endpoint_auth_method: 'client_secret_basic'
    });

    Promise.all([saveDB({ ...client, _id: id }, 'clients')]);

    return await res.json(client);
  } catch (error) {
    console.error(error);
    res.status(400).send('can not register client');
  }
};
