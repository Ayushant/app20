const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

// Fetch products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Place an order
exports.placeOrder = async (req, res) => {
    const { buyerId, sellerId, products, prescription, totalPrice, address, contactNumber } = req.body;

    try {
        const newOrder = new Order({
            buyerId,
            sellerId,
            products,
            prescription,
            totalPrice,
            address,
            contactNumber
        });
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Upload prescription
exports.uploadPrescription = (req, res) => {
    if (req.file) {
        res.status(200).json({ prescriptionUrl: req.file.path });
    } else {
        res.status(400).json({ error: 'No file uploaded' });
    }
};
