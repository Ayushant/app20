const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    isGeneral: { type: Boolean, required: true, default: false }, // false means prescription is required
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
