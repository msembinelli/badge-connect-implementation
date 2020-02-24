import * as express from 'express';

const router = express.Router();
import * as oauthController from './controllers/oauth.controller';
import * as bodyParser from 'body-parser';

function setNoCache(req, res, next) {
  res.set('Pragma', 'no-cache');
  res.set('Cache-Control', 'no-cache, no-store');
  next();
}

router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

router.get('/interaction/:uid', setNoCache, oauthController.startInteraction);

router.post(
  '/interaction/:uid/federated',
  bodyParser.urlencoded({ extended: false }),
  oauthController.startInteraction
);

router.get('/restore', setNoCache, oauthController.startInteraction);

router.get('/interaction/callback/auth0', (req, res) =>
  res.render('repost', { provider: 'auth0', layout: false })
);

// the following are set from the oidc library in the controller service
// registration API
// revocation API
// auth API

export default router;
