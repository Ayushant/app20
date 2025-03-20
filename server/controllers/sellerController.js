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

// Edit Product
exports.editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, category, isGeneral } = req.body;

        // Create update object
        const updateData = {
            name,
            price,
            description,
            category,
            isGeneral: isGeneral === 'true' || isGeneral === true
        };

        // If a new image is uploaded, add it to the update data
        if (req.file) {
            updateData.image = req.file.path;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

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
const jwt = require('jsonwebtoken');

// Register Seller
exports.registerSeller = async (req, res) => {
    const { name, email, password, shopName, gstNumber, location } = req.body;

    try {
        // Check if seller already exists
        const existingSeller = await Seller.findOne({ email });
        if (existingSeller) {
            return res.status(400).json({ message: 'Seller already exists' });
        }

        // Validate location data
        if (!location || !location.coordinates || !location.address) {
            return res.status(400).json({ message: 'Shop location is required' });
        }

        console.log("Loaction :",location)
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new seller with location
        const seller = new Seller({
            name,
            email,
            password: hashedPassword,
            shopName,
            gstNumber,
            location: {
                type: 'Point',
                coordinates: location.coordinates,
                address: location.address
            }
        });

        await seller.save();

        // Generate token
        const token = generateToken(seller._id, 'seller');

        // Send response
        res.status(201).json({
            _id: seller._id,
            name: seller.name,
            email: seller.email,
            shopName: seller.shopName,
            gstNumber: seller.gstNumber,
            location: seller.location,
            token
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Login Seller
exports.loginSeller = async (req, res) => {
    const { email, password } = req.body;

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
            gstNumber: seller.gstNumber,
            location: seller.location,
            token
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Seller Profile (including location)
exports.updateSellerProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, shopName, location } = req.body;

        const updateData = {
            name,
            shopName
        };

        // Update location if provided
        if (location && location.coordinates && location.address) {
            updateData.location = {
                type: 'Point',
                coordinates: location.coordinates,
                address: location.address
            };
        }

        const seller = await Seller.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        res.status(200).json({
            _id: seller._id,
            name: seller.name,
            email: seller.email,
            shopName: seller.shopName,
            location: seller.location
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Nearby Sellers (for buyer app)
exports.getNearbySellers = async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 3000 } = req.query; // maxDistance in meters (default 3km)

        const sellers = await Seller.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        }).select('-password'); // Exclude password from response

        res.status(200).json(sellers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Upload or add a product
exports.uploadProduct = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        const sellerId = decoded.id;

        const { name, description, price, category, isGeneral } = req.body;
        const image = req.file ? req.file.path : null;

        const newProduct = new Product({
            name,
            description,
            price,
            category,
            sellerId,
            image,
            isGeneral: isGeneral === 'true' || isGeneral === true
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get seller's products
exports.getSellerProducts = async (req, res) => {
    const { sellerId } = req.params;

    try {
        const products = await Product.find({ sellerId });
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get orders and respond (accept/reject)
exports.getOrders = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const orders = await Order.find({ sellerId })
            .populate('buyerId', 'name')
            .populate('products.productId');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Accept or reject order
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, action } = req.params;
        const sellerId = req.seller.id;

        // Validate action
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Use "accept" or "reject"' });
        }

        const order = await Order.findOne({ 
            _id: orderId,
            sellerId,
            status: 'pending'
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found or not pending' });
        }

        // Update order status
        order.status = action === 'accept' ? 'accepted' : 'rejected';
        await order.save();

        // If order is accepted, update total earnings
        if (action === 'accept') {
            // You can add additional logic here, like sending notifications
            // or updating inventory
        }

        res.status(200).json({
            message: `Order ${action}ed successfully`,
            order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

// Get seller's orders
exports.getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.seller.id;
        
        const orders = await Order.find({ sellerId })
            .populate({
                path: 'products.productId',
                select: 'name price image isGeneral'
            })
            .populate('buyerId', 'name phoneNumber')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const sellerId = req.seller.id;
        
        const order = await Order.findOne({ 
            _id: orderId,
            sellerId 
        }).populate({
            path: 'products.productId',
            select: 'name price image isGeneral'
        }).populate('buyerId', 'name phoneNumber');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
};



// Verify prescription
exports.verifyPrescription = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { verified } = req.body;
        const sellerId = req.seller.id;

        const order = await Order.findOne({ _id: orderId, sellerId });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update prescription verification status
        order.prescriptionVerified = verified;
        await order.save();

        res.status(200).json({ 
            message: `Prescription ${verified ? 'verified' : 'rejected'} successfully`,
            order 
        });
    } catch (error) {
        console.error('Error verifying prescription:', error);
        res.status(500).json({ error: 'Failed to verify prescription' });
    }
};

// Get dashboard data
exports.getDashboardData = async (req, res) => {
    console.log("req.seller",req.seller)
    try {
        const sellerId = req.seller.id;
        console.log("sellerId",sellerId)    
        
        // Get seller details
        const seller = await Seller.findById(sellerId).select('-password');
        if (!seller) {
            return res.status(404).json({ error: 'Seller not found' });
        }

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get pending orders for today
        const pendingOrders = await Order.find({
            sellerId,
            status: 'pending',
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('buyerId', 'name');

        // Get total earnings (from accepted orders)
        const totalEarnings = await Order.aggregate([
            {
                $match: {
                    sellerId: seller._id,
                    status: 'accepted'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPrice' }
                }
            }
        ]);

        res.status(200).json({
            seller: {
                name: seller.name,
                shopName: seller.shopName,
                email: seller.email
            },
            dashboard: {
                pendingOrders: pendingOrders.length,
                totalEarnings: totalEarnings[0]?.total || 0,
                todayOrders: pendingOrders
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};
