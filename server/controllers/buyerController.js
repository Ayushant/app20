const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const Seller = require('../models/sellerModel');

// Initialize AWS SNS client
const snsClient = new SNSClient({
    region: 'ap-south-1',  // AWS Mumbai region for India
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP temporarily (In production, use Redis or similar)
const otpStore = new Map();

// Fetch products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('sellerId', 'shopName')
            .sort({ createdAt: -1 }); // Get newest products first
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Place a new order
exports.placeOrder = async (req, res) => {
    try {
        const { items, totalPrice, deliveryCharge, platformFee, address, name } = req.body;
        const prescription = req.file ? req.file.path : null;
        
        // Validate if user is authenticated
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Parse items from JSON string
        const parsedItems = JSON.parse(items);
        if (!parsedItems || !parsedItems.length) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Check if any product requires prescription
        const requiresPrescription = parsedItems.some(item => !item.isGeneral);
        if (requiresPrescription && !prescription) {
            return res.status(400).json({ 
                error: 'Prescription is required for prescribed medicines' 
            });
        }

        // Get the first product to determine the seller
        const firstProduct = await Product.findById(parsedItems[0]._id).populate('sellerId');
        if (!firstProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const sellerId = firstProduct.sellerId._id;

        // Verify all products are from the same seller
        for (const item of parsedItems) {
            const product = await Product.findById(item._id);
            if (!product) {
                return res.status(404).json({ error: `Product with ID ${item._id} not found` });
            }
            
            if (product.sellerId.toString() !== sellerId.toString()) {
                return res.status(400).json({ 
                    error: 'All products in an order must be from the same seller' 
                });
            }
        }

        // Create new order
        const newOrder = new Order({
            buyerId: req.user.id,
            sellerId: sellerId,
            products: parsedItems.map(item => ({
                productId: item._id,
                quantity: item.quantity,
                requiresPrescription: !item.isGeneral
            })),
            prescription: prescription,
            totalPrice: totalPrice,
            deliveryCharge: deliveryCharge || 0,
            platformFee: platformFee || 0,
            address: address,
            name: name,
            contactNumber: req.user.phoneNumber,
            status: 'pending',
            prescriptionVerified: !requiresPrescription // automatically verify if no prescription needed
        });

        await newOrder.save();

        // Emit notification event to seller if socket.io is available
        if (global.io) {
            console.log("Emiting notification ")
            global.io.to(`seller_${sellerId}`).emit('newOrder', {
                orderId: newOrder._id,
                buyerName: name,
                totalPrice: newOrder.totalPrice,
                products: parsedItems
            });
        }

        res.status(201).json({
            message: 'Order placed successfully',
            orderId: newOrder._id
        });
    } catch (error) {
        console.error('Order placement error:', error);
        res.status(500).json({ error: 'Failed to place order' });
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

// Send OTP for registration/login
exports.sendOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber || phoneNumber.length !== 13) { // +91 + 10 digits
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with phone number
        otpStore.set(phoneNumber, {
            otp,
            expiryTime: Date.now() + 5 * 60 * 1000
        });

        // Prepare SNS message
        const params = {
            Message: `Your FairPlace-Med verification code is: ${otp}`,
            PhoneNumber: phoneNumber,
            MessageAttributes: {
                'AWS.SNS.SMS.SMSType': {
                    DataType: 'String',
                    StringValue: 'Transactional'
                }
            }
        };
        

        // Send SMS
        try {
            console.log('Sending SMS with params:', params);
            const result = await snsClient.send(new PublishCommand(params));
            console.log('SMS sent successfully:', result);
            
            // Check if user exists
            const userExists = await User.findOne({ phoneNumber });
            
            res.status(200).json({
                message: 'OTP sent successfully',
                isExistingUser: !!userExists,
                // For development only, remove in production
                otp: process.env.NODE_ENV === 'development' ? otp : undefined
            });
        } catch (snsError) {
            console.error('SNS Error:', snsError);
            throw new Error(`Failed to send SMS: ${snsError.message}`);
        }
    } catch (error) {
        console.error('Error in sendOTP:', error);
        res.status(500).json({ 
            error: 'Failed to send OTP',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Verify OTP and register/login user
exports.verifyOTP = async (req, res) => {
    try {
        const { phoneNumber, otp, name } = req.body;

        // Verify OTP
        const storedOTPData = otpStore.get(phoneNumber);
        if (!storedOTPData || storedOTPData.otp !== otp || Date.now() > storedOTPData.expiryTime) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Clear OTP from store
        otpStore.delete(phoneNumber);

        // Find or create user with default location
        let user = await User.findOne({ phoneNumber });
        if (!user && name) {
            // Create new user if doesn't exist and name is provided
            user = new User({
                name,
                phoneNumber,
                isVerified: true,
                location: {
                    type: 'Point',
                    coordinates: [0, 0], // Default coordinates
                    address: 'Not set' // Default address
                }
            });
        } else if (!user && !name) {
            return res.status(400).json({ error: 'Name is required for registration' });
        } else {
            user.isVerified = true;
            if (name) user.name = name; // Update name if provided
        }
        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: 'buyer' },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '30d' }
        );

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const { userId } = req.params;
        const { location } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { location },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ location: user.location });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get nearby sellers and their products
exports.getNearbyProducts = async (req, res) => {
    try {
        const { longitude, latitude } = req.query;
        const maxDistance = 3000; // 3km in meters

        const nearbySellers = await Seller.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: maxDistance
                }
            }
        });

        const sellerIds = nearbySellers.map(seller => seller._id);
        const products = await Product.find({ sellerId: { $in: sellerIds } })
            .populate('sellerId', 'name shopName location');

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('sellerId', 'shopName');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ buyerId: req.user.id })
            .populate({
                path: 'products.productId',
                select: 'name price image isGeneral'
            })
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findOne({ 
            _id: orderId,
            buyerId: req.user.id 
        }).populate({
            path: 'products.productId',
            select: 'name price image isGeneral'
        }).populate('sellerId', 'shopName address phoneNumber');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
};

// Get orders for the buyer
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ buyerId: req.user._id })
            .populate('sellerId', 'shopName')
            .populate('products.productId', 'name price image')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};
