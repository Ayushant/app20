import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import SellerManagement from './SellerManagement';
import RiderManagement from './RiderManagement';
import OrderManagement from './OrderManagement';

const Dashboard = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <Routes>
          <Route path="/sellers" element={<SellerManagement />} />
          <Route path="/riders" element={<RiderManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard; 