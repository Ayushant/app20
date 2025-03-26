const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');
const upload = require('multer')({ dest: 'uploads/' }); // Set up multer for file uploads

// Public routes
router.post('/register', adminController.regsister);

router.post('/login', adminController.login);

// Protected routes (require admin authentication)
router.use(authenticateAdmin);

// Add this new route
router.get('/accepted-orders', adminController.getAcceptedOrders);
router.put('/orders/:orderId/mark-assigned', adminController.markOrderAssigned);

// Seller routes
router.get('/sellers', adminController.getSeller);
router.delete('/sellers/:id', adminController.deleteSeller);

// New route for adding a rider with identity picture
router.post('/riders', upload.single('identityPicture'), adminController.addRider);

router.delete('/riders/:id', adminController.deleteRider);



module.exports = router;