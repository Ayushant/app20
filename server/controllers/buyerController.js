const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const Seller = require('../models/sellerModel');
const cloudinary = require('../config/cloudinary');

// Replace sendOTP with verifyPhone
exports.verifyPhone = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const user = await User.findOne({ phoneNumber });
        
        res.status(200).json({
            isExistingUser: !!user,
            message: 'Phone number checked successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Replace verifyOTP with confirmPhone
exports.confirmPhone = async (req, res) => {
    try {
        const { phoneNumber, confirmPhoneNumber, name } = req.body;

        if (phoneNumber !== confirmPhoneNumber) {
            return res.status(400).json({ error: 'Phone numbers do not match' });
        }

        let user = await User.findOne({ phoneNumber });

        if (user) {
            // Existing user - generate token
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '30d'
            });

            return res.status(200).json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    phoneNumber: user.phoneNumber,
                    isVerified: user.isVerified
                }
            });
        }

        // New user - create account
        if (!name) {
            return res.status(400).json({ error: 'Name is required for registration' });
        }

        user = new User({
            name,
            phoneNumber,
            isVerified: true
        });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                isVerified: true
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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
// Modify placeOrder function
exports.placeOrder = async (req, res) => {
    try {
        const { items, totalPrice, deliveryCharge, platformFee, address, name } = req.body;
        let prescriptionUrl = null;

        // Upload prescription to Cloudinary if provided
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            prescriptionUrl = result.secure_url;
            
            // Delete local file after upload
            fs.unlinkSync(req.file.path);
        }

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
            prescription: prescriptionUrl,
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
        // Delete local file if exists and upload failed
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
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
            createdAt: new Date()
        });

        // Send OTP via Twilio
        try {
            await twilioClient.messages.create({
                body: `Your FairPlace-Med verification code is: ${otp}`,
                from: twilioPhoneNumber,
                to: phoneNumber
            });
            
            res.status(200).json({ 
                message: 'OTP sent successfully',
                phoneNumber
            });
        } catch (twilioError) {
            console.error('Twilio SMS error:', twilioError);
            res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Server error' });
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

// Update user location
exports.updateLocation = async (req, res) => {
    try {
        const { address, location } = req.body;

        console.log(location)
        // Validate location data
        if (!location || !location.coordinates) {
            return res.status(400).json({ error: 'Invalid location coordinates' });
        }

        // Validate address format
        if (!address || typeof address !== 'string' || address.trim().length === 0) {
            return res.status(400).json({ error: 'Address is required' });
        }

        // Validate coordinates format
        if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            return res.status(400).json({ error: 'Invalid coordinates format' });
        }

        // Update user's location
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                location: {
                    type: 'Point',
                    coordinates: location.coordinates,
                    address: address.trim()
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'Location updated successfully',
            location: user.location
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ error: 'Failed to update location' });
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
        const { longitude, latitude } = req.query;
        
        // If location is provided, filter by distance
        if (longitude && latitude) {
            const maxDistance = 3000; // 3km in meters

            // First find nearby sellers
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

            // Get products from nearby sellers
            const products = await Product.find({
                sellerId: { $in: nearbySellers.map(seller => seller._id) }
            }).populate({
                path: 'sellerId',
                select: 'shopName location'
            });

            // Calculate distance for each product's seller
            const productsWithDistance = products.map(product => {
                const seller = nearbySellers.find(s => s._id.equals(product.sellerId._id));
                if (seller && seller.location && seller.location.coordinates) {
                    const [sellerLong, sellerLat] = seller.location.coordinates;
                    const distance = calculateDistance(
                        parseFloat(latitude),
                        parseFloat(longitude),
                        sellerLat,
                        sellerLong
                    );
                    return {
                        ...product.toObject(),
                        distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
                    };
                }
                return product;
            });

            return res.status(200).json(productsWithDistance);
        }

        // If no location provided, return all products
        const products = await Product.find().populate('sellerId', 'shopName');
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * Math.PI / 180;
}

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
