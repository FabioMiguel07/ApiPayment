import mongoose from 'mongoose';


const TokenSchema = new mongoose.Schema({
    merchantOrderId: {
        type: Number,
        index: true,
    },
    customerName: {
        type: String,
        required: true
    },
    cardToken: {
        type: String,
        required: true,
    },
    createAt : {
        type: Date
    }
},{
    timestamp: true
});

TokenSchema.index({
    merchantOrderId: 2
});

export default mongoose.model('Token', TokenSchema);
