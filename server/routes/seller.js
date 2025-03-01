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
const { uploadProduct, getOrders, updateOrderStatus, registerSeller, loginSeller, getSellerProducts } = require('../controllers/sellerController');
const multer = require('multer');
const router = express.Router();

const upload = multer({ dest: 'uploads/products/' });

router.post('/register', registerSeller);  // Seller registration
router.post('/login', loginSeller);
router.post('/upload-product', upload.single('image'), uploadProduct); // Upload product with image
router.get('/orders/:sellerId', getOrders); // Get orders for a seller
router.put('/order-status', updateOrderStatus); // Update order status (accept/reject)
router.get('/products/:sellerId', getSellerProducts); // Add this line

module.exports = router;
