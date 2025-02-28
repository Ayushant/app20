// const Seller = require('../models/Seller');
// const Product = require('../models/Product');

// // Create Seller Profile
// exports.createProfile = async (req, res) => {
//     const { name, email, password, storeName, storeAddress } = req.body;

//     try {
//         const newSeller = new Seller({ name, email, password, storeName, storeAddress });
//         await newSeller.save();
//         res.status(201).json(newSeller);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// };

// // Upload Product
// exports.uploadProduct = async (req, res) => {
//     const { name, description, price, category, sellerId } = req.body;

//     try {
//         const newProduct = new Product({ name, description, price, category, sellerId });
//         await newProduct.save();
//         res.status(201).json(newProduct);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// };

// // Edit Product
// exports.editProduct = async (req, res) => {
//     const { id } = req.params;
//     const { name, description, price, category } = req.body;

//     try {
//         const updatedProduct = await Product.findByIdAndUpdate(id, { name, description, price, category }, { new: true });
//         res.status(200).json(updatedProduct);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// };

// // Get Seller Products
// exports.getProducts = async (req, res) => {
//     const { sellerId } = req.query;

//     try {
//         const products = await Product.find({ sellerId });
//         res.status(200).json(products);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// };

// // Get Order Notifications
// exports.getOrderNotifications = async (req, res) => {
//     // Dummy implementation
//     res.json([
//         { orderId: '123', status: 'pending', product: 'Medicine A' },
//         { orderId: '124', status: 'pending', product: 'Medicine B' }
//     ]);
// };



const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const bcrypt = require('bcryptjs');
const Seller = require('../models/sellerModel');
const { generateToken } = require('../config/token');

// Register Seller
exports.registerSeller = async (req, res) => {
    const { name, email, password, shopName, gstNumber } = req.body;
    console.log(email)
    try {
        const existingSeller = await Seller.findOne({ email });
        if (existingSeller) {
            return res.status(400).json({ message: 'Seller already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const seller = new Seller({ name, email, password: hashedPassword, shopName, gstNumber });
        await seller.save();

        const token = generateToken(seller._id, 'seller');
        res.status(201).json({
            _id: seller._id,
            name: seller.name,
            email: seller.email,
            shopName: seller.shopName,
            gstNumber: seller.gstNumber,
            token
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Login Seller
exports.loginSeller = async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password)
    try {
        const seller = await Seller.findOne({ email });
        if (!seller) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, seller.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = generateToken(seller._id, 'seller');
        res.status(200).json({
            _id: seller._id,
            name: seller.name,
            email: seller.email,
            shopName: seller.shopName,
            token
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Upload or add a product
exports.uploadProduct = async (req, res) => {
    const { name, description, price, category, sellerId } = req.body;
    const image = req.file ? req.file.path : null;

    try {
        const newProduct = new Product({
            name,
            description,
            price,
            category,
            sellerId,
            image
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// View orders and respond (accept/reject)
exports.getOrders = async (req, res) => {
    const sellerId = req.params.sellerId;

    try {
        const orders = await Order.find({ sellerId }).populate('products.productId');
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Accept or reject order
exports.updateOrderStatus = async (req, res) => {
    const { orderId, status } = req.body;

    try {
        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
