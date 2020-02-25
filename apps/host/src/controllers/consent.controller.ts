import { Request, Response, NextFunction } from 'express';
import nanoid from 'nanoid';

import Consent from '../models/consent.model';
import { IConsent, IRisk } from '../types/consent.type';

export interface IConsentResponse {
  Data: IConsent;
  Risk: IRisk;
  Links: {
    Self: string;
  };
  Meta: {
    TotalPages: number;
  };
}

export function validateCreateConsent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { body } = req;

  if (!body.Data) {
    return res.status(400).send({
      status: {
        error: 'Data is required.',
        statusCode: 400,
        statusText: 'BAD_REQUEST'
      }
    });
  }

  if (!body.Data.Permissions) {
    return res.status(400).send({
      status: {
        error: 'Data.Permissions is required.',
        statusCode: 400,
        statusText: 'BAD_REQUEST'
      }
    });
  }

  if (!body.Risk) {
    return res.status(400).send({
      status: {
        error: 'Risk is required.',
        statusCode: 400,
        statusText: 'BAD_REQUEST'
      }
    });
  }

  if (!Array.isArray(body.Data.Permissions)) {
    return res.status(400).send({
      status: {
        error: 'Data.Permissions must be array.',
        statusCode: 400,
        statusText: 'BAD_REQUEST'
      }
    });
  }

  if (!(body.Data.Permissions.length > 0)) {
    return res.status(400).send({
      status: {
        error: 'Data.Permissions can not be an empty array.',
        statusCode: 400,
        statusText: 'BAD_REQUEST'
      }
    });
  }

  if (
    body.Data.Permissions.every(i => {
      return typeof i !== 'string';
    })
  ) {
    return res.status(400).send({
      status: {
        error: 'Data.Permissions must be array of string.',
        statusCode: 400,
        statusText: 'BAD_REQUEST'
      }
    });
  }

  next();
}

export async function createConsent(req: Request, res: Response) {
  try {
    const date = new Date();
    const consent = new Consent({
      ...req.body,
      Data: {
        ...req.body.Data,
        ConsentId: `urn-atb-intent-${nanoid(32)}`,
        Status: 'AwaitingAuthorisation',
        StatusUpdateDateTime: date.toISOString(),
        CreationDateTime: date.toISOString()
      }
    });

    await consent.save();

    const response: IConsentResponse = {
      Data: {
        ...consent.Data
      },
      Risk: consent.Risk,
      Links: {
        Self: `https://api.atb.com/open-banking/v3.1/aisp/account-access-consents/${consent.Data.ConsentId}`
      },
      Meta: {
        TotalPages: 1
      }
    };

    return res.status(201).json(response);
  } catch (error) {
    res.status(400).send({
      status: {
        error: error.message,
        statusCode: 400,
        statusText: 'BAD_REQUEST'
      }
    });
  }
}

export const getConsent = async (req, res) => {
  try {
    const { consentId } = req.params;
    const consent = await Consent.findOne({
      Data: { consentId }
    });

    const response: IConsentResponse = {
      Data: {
        ...consent.Data
      },
      Risk: consent.Risk,
      Links: {
        Self: `https://api.atb.com/open-banking/v3.1/aisp/account-access-consents/${consent.Data.ConsentId}`
      },
      Meta: {
        TotalPages: 1
      }
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(404).send('item not found');
  }
};

export const deleteConsent = async (req, res) => {
  try {
    const { consentId } = req.params;
    const consent = await Consent.deleteOne({
      Data: { consentId }
    });

    res.status(200);
  } catch (error) {
    res.status(404).send('item not found');
  }
};
