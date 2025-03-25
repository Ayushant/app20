const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', adminController.login);

// Protected routes (require admin authentication)
router.use(authenticateAdmin);

// Seller routes
router.post('/sellers', adminController.addSeller);
router.delete('/sellers/:id', adminController.deleteSeller);

// Rider routes
router.post('/riders', adminController.addRider);
router.delete('/riders/:id', adminController.deleteRider);

// Order assignment
router.post('/assign-order', adminController.assignOrder);

module.exports = router; 