const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    identityPicture: {
        type: String, // URL or path to the image
        required: true
    }
}, { timestamps: true });

// Add a new field for identity picture URL
riderSchema.add({
    identityPictureUrl: {
        type: String,
        required: false // Optional, can be set after upload
    }
});

module.exports = mongoose.model('Rider', riderSchema); 