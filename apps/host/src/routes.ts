import * as express from 'express';

import * as Manifest from './controllers/manifest.controller';
import * as Profile from './controllers/profile.controller';
import * as Consent from './controllers/consent.controller';
// import * as Setup from './generateData';
import verifyToken from './utils/verifyToken';
import { checkAccessToken } from './utils/checkAccessToken';
import { checkClientCredential } from './utils/checkClientCredential';
const router = express.Router();

router.get('/health', (req, res) => res.status(200).send());
router.get('/.well-known/openatbaccounts.json', Manifest.wellKnown);

// Account access consents
router.post(
  '/account-access-consents',
  checkClientCredential,
  Consent.validateCreateConsent,
  Consent.createConsent
);

router.get(
  '/accounts-access-consents/:consentId',
  checkAccessToken,
  Consent.getConsent
);

router.delete(
  '/accounts-access-consents/:consentId',
  checkAccessToken,
  Consent.deleteConsent
);

// Profile
router.post(
  '/profile',
  verifyToken,
  Profile.validateCreateProfile,
  Profile.createProfile
);
router.get('/profile', checkAccessToken, Profile.findProfile);
// router.post('/dev/setup', Setup.middleware);

export default router;
