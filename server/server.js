const express = require("express")
const mongoose = require('mongoose');
const connectdb = require("./config/db")
// const buyerRoutes = require('./routes/buyer')
const path = require('path');

const app = express()
app.use(express.json())
// const sellerRoutes = require('./routes/seller')
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/api/buyer', buyerRoutes);
// app.use('/api/seller', sellerRoutes);

connectdb()

const PORT = 8000
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`)
})