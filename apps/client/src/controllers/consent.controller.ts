import { saveDB, getById } from '../utils/mongo';
import { Issuer, custom } from 'openid-client';

export const clientCredentialGrant = async (req: any, res: any, next) => {
  const { id } = req.params;
  try {
    const redirect_uri = `${req.secure ? 'https' : 'http'}://${
      req.headers.host
    }/consent/callback/${id}`;

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

    const response = await client.grant({
      grant_type: 'client_credentials'
    });
    console.log(response);
  } catch (error) {
    console.error(error);
    res.status(400).send('client credential flow failed');
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
  const { selectedClient } = req.body;
  console.log(selectedClient);
  res.redirect(selectedClient);
};
