import { Request, Response } from 'express';
import { IManifestResponse, scope } from '../types/manifest.type';

// TODO Add default values for environment variables

const {
  AUTHORIZATION_URL,
  LOGO_URL,
  NAME,
  API_BASE,
  PRIVACY_POLICY_URL,
  REGISTRATION_URL,
  TERMS_OF_SERVICE_URL,
  AUTHORIZATION_TOKEN_URL,
  OPEN_ATB_ACCOUNTS_VERSION
} = process.env;

export const wellKnown = (req: Request, res: Response) => {
  const scopes: scope[] = [];
  const { host } = req.headers;
  const { secure } = req;
  res.json({
    openAtbAccountsAPI: [
      {
        apiBase: API_BASE,
        authorizationUrl: AUTHORIZATION_URL,
        id: `${
          secure ? 'https' : 'http'
        }://${host}/.well-known/openatbaccounts.json`,
        image: LOGO_URL,
        name: NAME,
        privacyPolicyUrl: PRIVACY_POLICY_URL,
        registrationUrl: REGISTRATION_URL,
        termsOfServiceUrl: TERMS_OF_SERVICE_URL,
        tokenUrl: AUTHORIZATION_TOKEN_URL,
        type: 'OpenAtbAccountsAPI',
        version: OPEN_ATB_ACCOUNTS_VERSION,
        scopesOffered: scopes
      }
    ],
    id: `${
      secure ? 'https' : 'http'
    }://${host}/.well-known/openatbaccounts.json`,
    type: 'Manifest'
  } as IManifestResponse);
};
