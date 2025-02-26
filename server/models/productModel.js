const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true }
});

module.exports = mongoose.model('Product', productSchema);
