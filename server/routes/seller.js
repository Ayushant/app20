const express = require('express');
const multer = require('multer');
const { authenticateSeller } = require('../middleware/auth');
const {
    registerSeller,
    loginSeller,
    updateSellerProfile,
    getNearbySellers,
    uploadProduct,
    getSellerProducts,
    editProduct,
    getOrders,
    updateOrderStatus,
    getDashboardData,
    downloadTemplate,
    bulkUpload,
    uploadExcel
} = require('../controllers/sellerController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Public routes
router.post('/register', upload.single('qrCode'), registerSeller);
router.post('/login', loginSeller);

// Protected routes (require seller auth)
router.use(authenticateSeller);

// Dashboard route
router.get('/dashboard', getDashboardData);

// Profile routes
// router.put('/profile/:id', updateSellerProfile);
router.get('/nearby', getNearbySellers);

// Product routes
router.post('/upload-product', upload.single('image'), uploadProduct);
router.get('/products/:sellerId', getSellerProducts);
router.put('/edit-product/:id', upload.single('image'), editProduct);

// Order routes
//not used yet
router.get('/orders/:sellerId', getOrders);
router.put('/order/:orderId/:action',  updateOrderStatus);
// router.put('/order/:orderId/prescription', verifyPrescription);

// Add these new routes for bulk upload
router.get('/download-template', authenticateSeller, downloadTemplate);
router.post('/bulk-upload', uploadExcel, bulkUpload);

module.exports = router;
