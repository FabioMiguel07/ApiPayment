import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import routes from './routes';
import ConfigMongoDB from '../src/database/configMongoDB';
import Youch from 'youch';


class App {

    constructor() {
        this.server = express();
        this.middlewares();
        this.routes();
        ConfigMongoDB.connetion();
        this.exceptionHandler();
    }

    routes(){
        this.server.use(routes);
    }

    middlewares(){
        //this.server.use(cors());
        this.server.use(express.json());
    }


    exceptionHandler() {
        this.server.use(async (error, request, response, next) => {

            if (process.env.NODE_ENV === 'desenvolvimento') {
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
