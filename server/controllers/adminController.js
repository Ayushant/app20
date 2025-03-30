const Admin = require('../models/adminModel');
const Seller = require('../models/sellerModel');
const Rider = require('../models/riderModel');
const Order = require('../models/orderModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Product = require('../models/productModel');
const { generateStaticMapUrl, getRouteMap } = require('../utils/olaMapsUtil');

const adminController = {
    async regsister(req, res) {
        try {
            const { email, password } = req.body;
            // console.log(email, password);
            // Check if admin already exists
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new admin instance
            const admin = new Admin({
                email,
                password: hashedPassword
            });

            // Save the admin
            await admin.save();

            const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
                expiresIn: '24h'
            });

            res.status(201).json({
                token,
                admin: {
                    id: admin._id,
                    email: admin.email,
                }
            });
        } catch (error) {
            console.error('Admin registration error:', error);
            res.status(500).json({ error: error.message });
        }
    },
    // Admin Authentication
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const admin = await Admin.findOne({ email });
            if(!admin) {
                return res.status(401).json({ error: 'User Not found' });
            }
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
                expiresIn: '24h'
            });

            res.json({
                token,
                admin: {
                    id: admin._id,
                    email: admin.email,
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },


async getSeller(req, res) {
    try {
      const sellers = await Seller.find();
      res.status(200).json(sellers);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  // Seller Management
  async deleteSeller(req, res) {
    try {
      const sellerId = req.params.id;
      
      // Delete all products associated with the seller
      await Product.deleteMany({ sellerId: sellerId });
      
      // Delete the seller
      await Seller.findByIdAndDelete(sellerId);
      
      res.status(200).json({ message: 'Seller and associated products deleted successfully' });
    } catch (error) {
      console.error('Error deleting seller:', error);
      res.status(400).json({ error: error.message });
    }
  },

  // Rider Management
  async addRider(req, res) {
    try {
      // Upload identity picture to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);
      
      // Create new rider instance with uploaded identity picture URL
      const newRider = new Rider({
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        identityPicture: result.secure_url // Store the URL from Cloudinary
      });

      await newRider.save();
      res.status(201).json(newRider);
    } catch (error) {
      console.error('Error adding rider:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async deleteRider(req, res) {
    try {
      await Rider.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Rider deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAcceptedOrders(req, res) {
    try {
      const orders = await Order.find({ status: 'accepted' })
        .populate('buyerId', 'name phoneNumber')
        .populate('sellerId', 'shopName location')
        .populate('products.productId', 'name');

      const formattedOrders = orders.map(order => ({
        orderId: order._id,
        buyer: {
          name: order.name,
          address: order.address,
          phone: order.contactNumber
        },
        seller: {
          shopName: order.sellerId.shopName,
          address: order.sellerId.location.address,
          coordinates: order.sellerId.location.coordinates
        },
        products: order.products.map(p => ({
          name: p.productId.name,
          quantity: p.quantity
        })),
        totalPrice: order.totalPrice,
        orderDate: order.createdAt
      }));

      res.status(200).json(formattedOrders);
    } catch (error) {
      console.error('Error fetching accepted orders:', error);
      res.status(400).json({ error: error.message });
    }
  },
  async markOrderAssigned(req, res) {
    try {
      const orderId = req.params.orderId;
      await Order.findByIdAndUpdate(orderId, { 
        deliveryStatus: 'shipped',
      });
      res.status(200).json({ message: 'Order marked as assigned successfully' });
    } catch (error) {
      console.error('Error marking order as assigned:', error);
      res.status(400).json({ error: error.message });
    }
  },
  async getRiders(req, res) {
    try {
      const riders = await Rider.find().sort({ createdAt: -1 });
      res.status(200).json(riders);
    } catch (error) {
      console.error('Error fetching riders:', error);
      res.status(500).json({ error: error.message });
    }
  },
  async getDeliveryRoute(req, res) {
      try {
          const { orderId } = req.params;
          const order = await Order.findById(orderId)
              .populate('sellerId', 'shopName phoneNumber location')
              .populate('buyerId', 'name phoneNumber');

          if (!order) {
              return res.status(404).json({ error: 'Order not found' });
          }

          // Generate static maps for both locations
          const pickupMapUrl = generateStaticMapUrl(order.sellerId.location.coordinates);
          const dropMapUrl = generateStaticMapUrl(order.deliveryDetails.dropLocation.coordinates);
          const routeMapUrl = await getRouteMap(
              order.sellerId.location.coordinates,
              order.deliveryDetails.dropLocation.coordinates
          );

          const deliveryInstructions = {
              orderId: order._id,
              step1: {
                  type: 'PICKUP',
                  location: {
                      coordinates: order.sellerId.location.coordinates,
                      address: order.sellerId.location.address,
                      mapUrl: pickupMapUrl
                  },
                  contact: {
                      name: order.sellerId.shopName,
                      phone: order.sellerId.phoneNumber
                  },
                  instructions: 'Collect the order from the seller'
              },
              step2: {
                  type: 'DELIVERY',
                  location: {
                      coordinates: order.deliveryDetails.dropLocation.coordinates,
                      address: order.deliveryDetails.dropLocation.address,
                      mapUrl: dropMapUrl
                  },
                  contact: {
                      name: order.name,
                      phone: order.contactNumber
                  },
                  instructions: 'Deliver the order to the customer'
              },
              routeOverview: {
                  mapUrl: routeMapUrl,
                  estimatedDistance: '{{calculate_distance}}', // You can implement distance calculation
                  orderDetails: {
                      items: order.products.length,
                      totalAmount: order.totalPrice
                  }
              }
          };

          res.status(200).json(deliveryInstructions);
      } catch (error) {
          console.error('Error generating delivery route:', error);
          res.status(500).json({ error: error.message });
      }
  }
};

module.exports = adminController;