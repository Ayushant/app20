const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes

const sellerRoutes = require('./routes/seller');
const buyerRoutes = require('./routes/buyer');
const adminRoutes = require('./routes/admin');


// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Make io available globally
global.io = io;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes

app.use('/api/seller', sellerRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/admin', adminRoutes);

// Set up Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Join seller room for notifications
    socket.on('joinSellerRoom', (sellerId) => {
        socket.join(`seller_${sellerId}`);
        console.log(`Seller ${sellerId} joined notification room`);
    });
    
    // Join buyer room for order updates
    socket.on('joinBuyerRoom', (buyerId) => {
        socket.join(`buyer_${buyerId}`);
        console.log(`Buyer ${buyerId} joined notification room`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Start server
        const PORT = process.env.PORT || 8000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });