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
  BADGE_CONNECT_VERSION
} = process.env;

export const wellKnown = (req: Request, res: Response) => {
  const scopes: scope[] = [];
  const { host } = req.headers;
  const { secure } = req;
  res.json({
    badgeConnectAPI: [
      {
        apiBase: API_BASE,
        authorizationUrl: AUTHORIZATION_URL,
        id: `${
          secure ? 'https' : 'http'
        }://${host}/.well-known/badgeconnect.json`,
        image: LOGO_URL,
        name: NAME,
        privacyPolicyUrl: PRIVACY_POLICY_URL,
        registrationUrl: REGISTRATION_URL,
        termsOfServiceUrl: TERMS_OF_SERVICE_URL,
        tokenUrl: AUTHORIZATION_TOKEN_URL,
        type: 'BadgeConnectAPI',
        version: BADGE_CONNECT_VERSION,
        scopesOffered: scopes
      }
    ],
    id: `${secure ? 'https' : 'http'}://${host}/.well-known/badgeconnect.json`,
    '@context': 'https://purl.imsglobal.org/spec/ob/v2p1/ob_v2p1.jsonld',
    type: 'Manifest'
  } as IManifestResponse);
};
