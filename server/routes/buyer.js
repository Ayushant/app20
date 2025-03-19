const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const {
    sendOTP,
    verifyOTP,
    placeOrder,
    getOrders,
    getAllProducts,
    updateLocation
} = require('../controllers/buyerController');

// Configure multer for prescription upload
const upload = multer({ dest: 'uploads/prescriptions/' });

// Public routes (no auth required)
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/products', getAllProducts);

// Protected routes (auth required)
router.post('/order/place', auth, upload.single('prescription'), placeOrder);
router.get('/orders', auth, getOrders);
router.put('/update-location', auth, updateLocation);

module.exports = router;

