import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RiderManagement = () => {
  const [riders, setRiders] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/admin/riders', formData);
      setRiders([...riders, response.data]);
      setFormData({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error adding rider:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/riders/${id}`);
      setRiders(riders.filter(rider => rider._id !== id));
    } catch (error) {
      console.error('Error deleting rider:', error);
    }
  };

  return (
    <div>
      <h2>Rider Management</h2>
      {/* Add form and rider list implementation */}
    </div>
  );
};

export default RiderManagement; 