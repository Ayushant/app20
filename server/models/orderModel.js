const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    products: [{ 
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1 }
    }],
    prescription: { type: String }, // For disease-specific medicines
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    totalPrice: { type: Number, required: true },
    address: { type: String, required: true },
    contactNumber: { type: String, required: true }
});

module.exports = mongoose.model('Order', orderSchema);
