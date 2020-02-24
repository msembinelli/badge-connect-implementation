import { Request, Response } from 'express';
import client_credentials from '../models/client_credentials.model';
import profile from '../models/profile.model';

export const checkClientCredential = async (req: any, res: Response, next) => {
  try {
    console.log('checking access token - client credential');

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(403).send({
        status: {
          error: 'Header must be provided',
          statusCode: 401,
          statusText: 'UNAUTHENTICATED'
        }
      });
    } else {
      const token = authHeader.split(' ')[1];
      console.log(token);
      console.log('getting the  access token back from the db');
      const accessToken = await client_credentials.findOne({
        id: token
      });
      //  console.log(accessToken);

      if (!accessToken) {
        res.status(401).send({
          status: {
            error: 'Access Token is not found',
            statusCode: 401,
            statusText: 'UNAUTHENTICATED'
          }
        });
      } else {
        console.log('getting the uid and profile objects from the database');
        req.uid = accessToken.toJSON().payload.accountId;
        req.profile = await profile.findOne({
          id: `${process.env.BASE_URL}/profiles/${
            accessToken.toJSON().payload.accountId
          }`
        });
        next();
      }
    }
  } catch (error) {
    console.log(error);
  }
};
