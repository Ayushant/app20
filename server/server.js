const express = require("express")
const mongoose = require('mongoose');
const connectdb = require("./config/db")
// const buyerRoutes = require('./routes/buyer')
const path = require('path');
const cors = require('cors');


const app = express()

// app.use(cors());
app.use(cors({
    origin: "*", // Allow all origins (Change to specific domain for production)
    methods: ["GET", "POST"], // Allow only necessary methods
    allowedHeaders: ["Content-Type", "Authorization"]
  }))
app.use(express.json())

app.get("/", (req, res) => {
 res.send("hello")
})
const sellerRoutes = require('./routes/seller')
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);

connectdb()

const PORT = 8000
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`)
})