const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    products: [{ 
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1 },
        requiresPrescription: { type: Boolean, required: true } // Track prescription requirement per product
    }],
    prescription: { type: String }, // Required only if any product requires prescription
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    totalPrice: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    address: { type: String, required: true },
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    prescriptionVerified: { type: Boolean, default: false }, // New field to track prescription verification
    notificationSent: { type: Boolean, default: false },
    deliveryStatus: { type: String, enum: ['preparing', 'shipped', 'delivered'], default: 'preparing' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
