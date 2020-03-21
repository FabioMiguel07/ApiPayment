import mongoose from 'mongoose';
import 'dotenv/config';

class ConfigMongoDB {

    connetion() {
        const stringConnection = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}` + process.env.MONGO_URL;
        console.log('String Connection: ' + stringConnection);

        mongoose.connect(stringConnection, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }

}

export default new ConfigMongoDB();
