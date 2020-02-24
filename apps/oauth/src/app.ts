// TODO Add env variables for both JWKS and views folder

import * as path from 'path';

import express from 'express';
import cookieParser from 'cookie-parser';

import { provider } from './controllers/oauth.controller';
import router from './routes';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
  }

  private async config(): Promise<any> {
    this.app.use(cookieParser());
    // let's work with express here, below is just the interaction definition
    this.app.set('trust proxy', true);
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.resolve(__dirname, './../views'));
    this.app.enable('trust proxy');
    // this.app.use(express.static(__dirname + 'public'));
    this.app.use(
      express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 })
    );

    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Methods',
        'PUT, GET, POST, DELETE, OPTIONS'
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials'
      );
      res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });
    this.app.use(router);
    const callback = (await provider()).callback;
    this.app.use(callback);
  }
}

export default new App().app;
