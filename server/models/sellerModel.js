const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    shopName: { type: String, required: true },
    gstNumber: { type: String, required: true },
    paymentQRCode: { type: String, required: true }, // Added field for QR code image URL
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: { type: String, required: true }
    }
});

sellerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Seller', sellerSchema);
