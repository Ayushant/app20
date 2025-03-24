import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SellerManagement = () => {
  const [sellers, setSellers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/admin/sellers', formData);
      setSellers([...sellers, response.data]);
      setFormData({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error adding seller:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/sellers/${id}`);
      setSellers(sellers.filter(seller => seller._id !== id));
    } catch (error) {
      console.error('Error deleting seller:', error);
    }
  };

  return (
    <div>
      <h2>Seller Management</h2>
      {/* Add form and seller list implementation */}
    </div>
  );
};

export default SellerManagement;