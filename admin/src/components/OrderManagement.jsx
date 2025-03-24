import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders and available riders
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersResponse, ridersResponse] = await Promise.all([
          axios.get('/api/admin/orders'),
          axios.get('/api/admin/riders')
        ]);
        setOrders(ordersResponse.data);
        setRiders(ridersResponse.data);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle rider assignment
  const handleAssignRider = async (orderId, riderId) => {
    try {
      const response = await axios.post('/api/admin/assign-order', {
        orderId,
        riderId
      });
      
      // Update the orders list with the newly assigned order
      setOrders(orders.map(order => 
        order._id === orderId ? response.data : order
      ));
    } catch (err) {
      setError('Failed to assign rider');
      console.error('Error assigning rider:', err);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Order Management</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Order ID</th>
              <th className="px-6 py-3 text-left">Customer</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Total</th>
              <th className="px-6 py-3 text-left">Rider</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{order._id.slice(-6)}</td>
                <td className="px-6 py-4">{order.customerName}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">${order.total}</td>
                <td className="px-6 py-4">
                  {order.status !== 'delivered' ? (
                    <select
                      className="border rounded px-2 py-1"
                      value={order.riderId || ''}
                      onChange={(e) => handleAssignRider(order._id, e.target.value)}
                    >
                      <option value="">Select Rider</option>
                      {riders.map((rider) => (
                        <option key={rider._id} value={rider._id}>
                          {rider.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    order.riderName
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => {/* Add view details logic */}}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No orders found
        </div>
      )}
    </div>
  );
};

export default OrderManagement; 