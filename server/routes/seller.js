// const express = require('express');
// const { createProfile, uploadProduct, editProduct, getProducts, getOrderNotifications } = require('../controllers/sellerController');
// // const router = express.Router();

// // router.post('/create-profile', createProfile);
// // router.post('/upload-product', uploadProduct);
// // router.put('/edit-product/:id', editProduct);
// // router.get('/products', getProducts);
// // router.get('/notifications', getOrderNotifications);

// // module.exports = router;



const express = require('express');
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
const multer = require('multer');
const router = express.Router();

const { authenticateSeller } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/products/' });

// Auth routes (no auth required)
router.post('/register', registerSeller);
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
