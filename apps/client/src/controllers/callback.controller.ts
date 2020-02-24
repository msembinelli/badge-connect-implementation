import { getById, saveDB, getOneWhere, removeOne } from '../utils/mongo';
import { Issuer, custom } from 'openid-client';
import { Response } from 'express';
import fetch from 'node-fetch';
import { IProfile } from '../types/profile.type';
import * as faker from 'faker';

custom.setHttpOptionsDefaults({
  timeout: 50000
});

export const callback = async (req: any, res: Response, next) => {
  const { id } = req.params;

  try {
    const redirect_uri = `${req.secure ? 'https' : 'http'}://${
      req.headers.host
    }/callback/${id}`;

    console.log('getting client and wellKnow from db');

    // get both the client and wellKnown from the database
    const [wellKnownMetadata, clientMetadata] = await Promise.all([
      getById(id, 'wellKnows'),
      getById(id, 'clients')
    ]);

    // get the wellKnown manifest from the host
    const issuer = new Issuer(wellKnownMetadata);

    const client = new issuer.Client(clientMetadata);

    // get the request params for use with the callback
    const params = client.callbackParams(req);
    console.log(params);

    console.log('getting state from the db');

    const response = await getOneWhere({ state: params.state }, 'state');
    console.log(response);
    const { code_verifier, uid } = response;

    console.log(code_verifier, uid, redirect_uri, params);

    console.log('executing callback flow ');
    // get the access_token
    if (Object.keys(params).length) {
      const tokenSet = await client.callback(redirect_uri, params, {
        code_verifier,
        state: params.state,
        response_type: 'code'
      });

      // get the user profile
      console.log(client);
      const userinfo = await client.userinfo(tokenSet);
      console.log('got user info', userinfo);

      const profile: IProfile = {
        name: userinfo.name,
        photo: userinfo.picture,
        jobTitle: 'ATB Customer',
        password: faker.internet.password(),
        id: userinfo.sub,
        email: userinfo.email
      };

      const prof = await getOneWhere({ _id: profile.id }, 'profiles');
      if (prof.email) {
        await removeOne({ _id: profile.id }, 'profiles');
      }
      await saveDB({ ...profile, _id: profile.id }, 'profiles');

      console.log('adding the hostProfiles and accessTokens to the database');

      await Promise.all([
        // saveDB({ ...userinfo, uid, clientInternalId: id }, 'hostProfiles'),
        saveDB({ ...tokenSet, uid, clientInternalId: id }, 'accessTokens')
      ]);

      req.apiBase = wellKnownMetadata.openAtbAccountsAPI[0].apiBase;
      req.uid = uid;
      req.tokenSet = tokenSet;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(400).send('oauth flow failed');
  }
};

export const createConsent = async (req: any, res: any, next) => {
  try {
    console.log('creating initial account-access-consent');
    // console.log(req.tokenSet.access_token);

    const response = await fetch(`${req.apiBase}/account-access-consents`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + req.tokenSet.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Data: {
          Permissions: [
            'ReadAccountsDetail',
            'ReadBalances',
            'ReadBeneficiariesDetail',
            'ReadDirectDebits',
            'ReadProducts',
            'ReadStandingOrdersDetail',
            'ReadTransactionsCredits',
            'ReadTransactionsDebits',
            'ReadTransactionsDetail',
            'ReadOffers',
            'ReadPAN',
            'ReadParty',
            'ReadPartyPSU',
            'ReadScheduledPaymentsDetail',
            'ReadStatementsDetail'
          ],
          ExpirationDateTime: '',
          TransactionFromDateTime: '',
          TransactionToDateTime: ''
        },
        Risk: {}
      })
    });

    const data = await response.json();

    console.log('consent response', data);

    // TODO loop and get all the assertions
    console.log('saving the consent into the database');

    await saveDB(data, 'consents');
  } catch (error) {
    console.error(error);
    res.status(400).send('failed to fetch consent using the access token');
  }

  next();
};

export const redirect = (req, res) => {
  return res.redirect(
    `${req.secure ? 'https' : 'http'}://${req.headers.host}/profile/${req.uid}`
  );
};
