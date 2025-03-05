const express = require('express');
const router = express.Router();
const {
    sendOTP,
    verifyOTP,
    updateLocation,
    getAllProducts
} = require('../controllers/buyerController');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.put('/location/:userId', updateLocation);
router.get('/products', getAllProducts);

module.exports = router;

