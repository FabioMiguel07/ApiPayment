import mongoose from 'mongoose';
import 'dotenv/config';
import Logger from '../log/LoggerService';

const logger = new Logger('ConfigMongoDB');

class ConfigMongoDB {

    connetion() {
        logger.setLogData({"MongoDB":"MongoDB"});

        logger.info("Inicializando Banco de Dados" , "MongoDB");

        const mongoURL = process.env.MODE_ENV === 'Producao' ? process.env.MONGO_URL : process.env.MONGO_URL_DEV;

        const stringConnection = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}`
            + mongoURL;

        logger.info("String Connection: " + stringConnection, "MongoDB" );

        mongoose.connect(stringConnection, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoIndex: false
        });
    }

}

export default new ConfigMongoDB();
