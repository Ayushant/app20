const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
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
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
