import mongoose from 'mongoose';


const TokenSchema = new mongoose.Schema({
    merchantOrderId: {
        type: Number,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    cardToken: {
        type: String,
        required: true,
    },
    links : {
        Method: String,
        Href: String
    },
    createAt : {
        type: Date
    }
},{
    timestamp: true
});


export default mongoose.model('Token', TokenSchema);