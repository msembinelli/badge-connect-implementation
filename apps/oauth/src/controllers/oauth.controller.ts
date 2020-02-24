import assert from 'assert';
import Provider from 'oidc-provider';
import MongoAdapter from '../adapters/mongodb';
import { Account } from './../services/account.service';
import querystring from 'querystring';
import { Issuer } from 'openid-client';
import crypto from 'crypto';

// TODO turn the following into environment variables
// TODO add jsonWebKeys as a string in environment variables

assert(process.env.SECURE_KEY, 'process.env.SECURE_KEY missing');
assert.equal(
  process.env.SECURE_KEY.split(',').length,
  2,
  'process.env.SECURE_KEY format invalid'
);
export const provider = async () => {
  const oidc = new Provider(process.env.BASE_URL, {
    adapter: MongoAdapter, // the adapter to use later on ,
    clientDefaults: {
      grant_types: ['authorization_code'], // , 'refresh_token'
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_basic'
    },
    pkceMethods: ['S256'],

    // oidc-provider only looks up the accounts by their ID when it has to read the claims,
    // tslint:disable-next-line:object-literal-sort-keys
    features: {
      devInteractions: { enabled: false },
      introspection: { enabled: true },
      registration: { enabled: true },
      registrationManagement: { enabled: true },
      revocation: { enabled: true }
    },
    // passing it our Account model method is sufficient, it should return a Promise that resolves
    // with an object with accountId property and a claims method.
    findAccount: Account.findAccount,

    // let's tell oidc-provider you also support the email scope, which will contain email and
    // email_verified claims
    claims: {
      email: ['email', 'email_verified'],
      openid: ['sub']
    },
    scopes: ['openid', 'email', 'profile'],

    // let's tell oidc-provider where our own interactions will be
    // setting a nested route is just good practice so that users
    // don't run into weird issues with multiple interactions open
    // at a time.

    interactions: {
      url: async (ctx, interaction) => {
        return `/interaction/${ctx.oidc.uid}`;
      }
    },
    //   the routes defined by the library
    routes: {
      authorization: process.env.AUTHORIZATION_ENDPOINT,
      check_session: process.env.SESSION_ENDPOINT,
      code_verification: process.env.CODE_VERIFICATION_ENDPOINT,
      device_authorization: process.env.DEVICE_AUTHORIZATION_ENDPOINT,
      end_session: process.env.END_SESSION_ENDPOINT,
      introspection: process.env.INTROSPECTION_ENDPOINT,
      jwks: process.env.JWKS_ENDPOINT,
      pushed_authorization_request:
        process.env.PUSHED_AUTHORIZATION_REQUEST_ENDPOINT,
      registration: process.env.REGISTRATION_ENDPOINT,
      revocation: process.env.REVOCATION_ENDPOINT,
      token: process.env.TOKEN_ENDPOINT,
      userinfo: process.env.USER_INFO_ENDPOINT
    },
    extraClientMetadata: {
      properties: [
        'software_id',
        'software_version',
        'tos_uri',
        'policy_uri',
        'logo_uri',
        'client_uri',
        'client_name'
      ]
    },
    cookies: {
      long: { signed: false, maxAge: 1 * 24 * 60 * 60 * 1000 }, // 1 day in ms
      short: { path: '/' },
      keys: process.env.SECURE_KEY.split(',')
    }
  });

  oidc.proxy = true;
  oidc.keys = process.env.SECURE_KEY.split(',');

  const auth0 = await Issuer.discover(
    'https://atbinnovation.auth0.com/.well-known/openid-configuration'
  );
  const auth0Client = new auth0.Client({
    client_id: '4id4Td92AMTBr9Bs1wTLJvCSgEtczxzw',
    response_types: ['id_token'],
    redirect_uris: [`http://localhost:5000/interaction/callback/auth0`],
    grant_types: ['implicit']
  });
  oidc.app.context.auth0 = auth0Client;

  const { interactionFinished } = oidc;
  oidc.interactionFinished = (...args) => {
    const { login } = args[2];
    if (login) {
      Object.assign(args[2].login, {
        acr: 'urn:mace:incommon:iap:bronze',
        amr: login.account.startsWith('auth0') ? ['auth0'] : ['pwd']
      });
    }

    return interactionFinished.call(oidc, ...args);
  };

  return oidc;
};

export const startInteraction = async (req, res, next) => {
  try {
    // tslint:disable-next-line: no-console
    const oidc = await provider();
    console.log(oidc.app.context.auth0);
    const interaction = await oidc.interactionDetails(req, res);
    console.log(interaction);

    const path = `/interaction/${interaction.uid}/federated`;
    console.log(req.params);

    const callbackParams = oidc.app.context.auth0.callbackParams(req);
    console.log('callbackparams', callbackParams);

    if (!Object.keys(callbackParams).length) {
      const state = `${req.params.uid}|${crypto
        .randomBytes(32)
        .toString('hex')}`;
      const nonce = crypto.randomBytes(32).toString('hex');

      res.cookie('auth0.state', state, {
        path,
        sameSite: 'strict'
      });
      res.cookie('auth0.nonce', nonce, {
        path,
        sameSite: 'strict'
      });

      return res.redirect(
        oidc.app.context.auth0.authorizationUrl({
          state,
          nonce,
          scope: 'openid email profile'
        })
      );
    }

    // callback
    const state = req.cookies['auth0.state'];
    res.clearCookie('auth0.state', { path });
    const nonce = req.cookies['auth0.nonce'];
    res.clearCookie('auth0.nonce', { path });

    const tokenset = await oidc.app.context.auth0.callback(
      undefined,
      callbackParams,
      {
        state,
        nonce,
        response_type: 'id_token'
      }
    );
    console.log(tokenset);
    const account = await Account.findByFederated('auth0', tokenset.claims());

    const result = {
      login: {
        account: account.accountId
      },
      consent: {
        rejectedScopes: [],
        rejectedClaims: []
      },
      meta: {}
    };
    console.log(result);
    return oidc.interactionFinished(req, res, result, {
      mergeWithLastSubmission: false
    });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};
