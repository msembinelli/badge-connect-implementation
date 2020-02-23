import assert from 'assert';
import Provider from 'oidc-provider';
import MongoAdapter from '../adapters/mongodb';
import { Account } from './../services/account.service';
import querystring from 'querystring';

// TODO turn the following into environment variables
// TODO add jsonWebKeys as a string in environment variables

assert(process.env.SECURE_KEY, 'process.env.SECURE_KEY missing');
assert.equal(
  process.env.SECURE_KEY.split(',').length,
  2,
  'process.env.SECURE_KEY format invalid'
);

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
  scopes: ['openid'],

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

export const callback = oidc.callback;

export const startInteraction = async (req, res, next) => {
  try {
    // tslint:disable-next-line: no-console
    console.log(req.query);
    const interaction = await oidc.interactionDetails(req, res);
    console.log(interaction);

    const params = {
      ...interaction.params,
      client_id: '4id4Td92AMTBr9Bs1wTLJvCSgEtczxzw',
      redirect_uri: 'http://localhost:5000/restore'
    };

    console.log(params);

    if (req.query.code && req.query.state) {
      /*return res.render('login', {
        client,
        details: prompt.details,
        flash: undefined,
        params,
        title: 'Sign-in',
        uid
      });*/

      res.redirect(
        `${interaction.params.redirect_uri}?${querystring.stringify(req.query)}`
      );

      await oidc.interactionFinished(req, res, req.query, {
        mergeWithLastSubmission: true
      });
    }

    res.redirect(
      'https://atbinnovation.auth0.com/authorize?' +
        querystring.stringify(params)
    );

    // console.log('Client :: ', JSON.stringify(client, null, 2));

    // return res.render('interaction', {
    //   client,
    //   details: prompt.details,
    //   params,
    //   title: 'Authorize',
    //   uid
    // });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { uid, prompt, params } = await oidc.interactionDetails(req, res);
    const client = await oidc.Client.find(params.client_id);
    console.log(params);

    const accountId = await Account.authenticate(
      req.body.email,
      req.body.password
    );

    if (!accountId) {
      res.render('login', {
        client,
        details: prompt.details,
        uid,
        params: {
          ...params,
          login_hint: req.body.email
        },
        title: 'Sign-in',
        flash: 'Invalid email or password.'
      });
      return;
    }

    const result = {
      login: {
        account: accountId
      }
    };

    await oidc.interactionFinished(req, res, result, {
      mergeWithLastSubmission: false
    });
  } catch (err) {
    next(err);
  }
};

export const confirm = async (req, res, next) => {
  try {
    const result = {
      consent: {
        // rejectedScopes: [], // < uncomment and add rejections here
        // rejectedClaims: [], // < uncomment and add rejections here
      }
    };
    console.log('getting into the confirm page');
    await oidc.interactionFinished(req, res, result, {
      mergeWithLastSubmission: true
    });
  } catch (err) {
    next(err);
  }
};
export const abort = async (req, res, next) => {
  try {
    const result = {
      error: 'access_denied',
      error_description: 'End-User aborted interaction'
    };
    await oidc.interactionFinished(req, res, result, {
      mergeWithLastSubmission: false
    });
  } catch (err) {
    next(err);
  }
};
