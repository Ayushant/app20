const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// Initialize AWS SNS client
const snsClient = new SNSClient({
    region: process.env.AWS_REGION,
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

// Place order
exports.placeOrder = async (req, res) => {
    try {
        const { items, totalPrice, deliveryCharge, platformFee, address } = req.body;
        const prescription = req.file ? req.file.path : null;
        
        // Validate if user is authenticated
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if any product requires prescription
        const requiresPrescription = items.some(item => !item.isGeneral);
        if (requiresPrescription && !prescription) {
            return res.status(400).json({ 
                error: 'Prescription is required for some medicines' 
            });
        }

        // Create new order
        const newOrder = new Order({
            buyerId: req.user.id,
            products: items.map(item => ({
                productId: item._id,
                quantity: item.quantity,
                requiresPrescription: !item.isGeneral
            })),
            prescription,
            totalPrice,
            deliveryCharge,
            platformFee,
            address,
            contactNumber: req.user.phoneNumber,
            status: 'pending'
        });

        await newOrder.save();

        // Clear cart from AsyncStorage is handled on client side
        res.status(201).json(newOrder);
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

        // Generate OTP
        const otp = generateOTP();

        // Store OTP with phone number (with 5 minutes expiry)
        otpStore.set(phoneNumber, {
            otp,
            expiryTime: Date.now() + 5 * 60 * 1000
        });

        // Send OTP via AWS SNS
        const params = {
            Message: `Your FairPlace-Med verification code is: ${otp}`,
            PhoneNumber: phoneNumber,
            MessageAttributes: {
                'AWS.SNS.SMS.SenderID': {
                    DataType: 'String',
                    StringValue: 'FairPlace'
                },
                'AWS.SNS.SMS.SMSType': {
                    DataType: 'String',
                    StringValue: 'Transactional'
                }
            }
        };

        try {
            await snsClient.send(new PublishCommand(params));
        } catch (snsError) {
            console.error('SNS Error:', snsError);
            return res.status(500).json({ error: 'Failed to send OTP' });
        }

        // Check if user exists
        const userExists = await User.findOne({ phoneNumber });

        res.status(200).json({
            message: 'OTP sent successfully',
            isExistingUser: !!userExists
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
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

        // Find or create user
        let user = await User.findOne({ phoneNumber });
        if (!user && name) {
            // Create new user if doesn't exist and name is provided
            user = new User({
                name,
                phoneNumber,
                isVerified: true
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
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ buyerId: req.user.id })
            .populate('products.productId')
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
