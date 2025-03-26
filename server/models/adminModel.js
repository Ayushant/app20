const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Hash password before saving
// adminSchema.pre('save', async function(next) {
//     if (this.isModified('password')) {
//         this.password = await bcrypt.hash(this.password, 8);
//     }
//     next();
// });

// Method to compare password
// adminSchema.methods.comparePassword = async function(password) {
//     return bcrypt.compare(password, this.password);
// };

module.exports = mongoose.model('Admin', adminSchema); 