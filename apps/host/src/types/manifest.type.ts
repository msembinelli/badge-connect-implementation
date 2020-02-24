export interface IOpenAtbAccountsAPI {
  id: string;
  type: string;
  apiBase: string;
  authorizationUrl: string;
  image: string;
  name: string;
  privacyPolicyUrl: string;
  registrationUrl: string;
  registration_endpoint?: string;
  authorization_endpoint?: string;
  scopesOffered: string[];
  termsOfServiceUrl: string;
  tokenUrl: string;
  version: string;
}

export interface IManifestResponse {
  id: string;
  type: string;
  openAtbAccountsAPI: IOpenAtbAccountsAPI[];
}

export type scope =
  | 'openid'
  | 'profile'
  | 'offline_access'
  | 'email'
  | 'accounts';
