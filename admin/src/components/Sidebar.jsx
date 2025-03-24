import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  // Navigation items with icons and paths
  const navItems = [
    {
      title: 'Dashboard',
      path: '/',
      icon: '📊'
    },
    {
      title: 'Sellers',
      path: '/sellers',
      icon: '🏪'
    },
    {
      title: 'Riders',
      path: '/riders',
      icon: '🛵'
    },
    {
      title: 'Orders',
      path: '/orders',
      icon: '📦'
    }
  ];

  return (
    <div className="w-64 min-h-screen bg-gray-800 text-white p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>
      
      <nav>
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-8">
        <button
          onClick={() => {/* Add logout logic here */}}
          className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 rounded-lg flex items-center gap-3"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 