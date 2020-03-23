import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import routes from './routes';
import ConfigMongoDB from './database/ConfigMongoDB';
import Youch from 'youch';
import * as Sentry from '@sentry/node';
import sentry from "./config/sentry";



class App {

    constructor() {
        this.server = express();

        Sentry.init(sentry);

        this.middlewares();
        this.routes();
        ConfigMongoDB.connetion();
        this.exceptionHandler();

    }

    routes(){
        this.server.use(routes);
        this.server.use(Sentry.Handlers.errorHandler());
    }

    middlewares(){
        this.server.use(Sentry.Handlers.requestHandler());
        this.server.use(express.json());
    }


    exceptionHandler() {
        this.server.use(async (error, request, response, next) => {

            if (process.env.MODE_ENV === 'desenvolvimento') {
                return response.status(500).json(await new Youch(error, request).toJSON());
            } else {
                return response.status(500).json({
                    error: "Internal Server Error"
                });
            }

        })
    }


}

export default new App().server;
