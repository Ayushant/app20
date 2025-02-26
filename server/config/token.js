const jwt = require('jsonwebtoken');

exports.generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
        expiresIn: '30d'
    });
};