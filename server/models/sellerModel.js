const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    //todo phone no
    password: { type: String, required: true },
    shopName: { type: String, required: true },
    gstNumber: { type: String, required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: { type: String, required: true }
    }
});

// Create a 2dsphere index for location-based queries
sellerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Seller', sellerSchema);
