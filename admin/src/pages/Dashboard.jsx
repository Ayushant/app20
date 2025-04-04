import { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';

export default function Dashboard() {
  const [riders, setRiders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [newRider, setNewRider] = useState({
    name: '',
    phoneNumber: '',
    identityPicture: null
  });

  // Fetch riders and sellers
  useEffect(() => {
    fetchRiders();
    fetchSellers();
    fetchAcceptedOrders();
  }, []);

  const fetchRiders = async () => {
    try {
      const response = await axiosInstance.get('/riders');
      setRiders(response.data);
    } catch (error) {
      console.error('Error fetching riders:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await axiosInstance.get('/sellers');
      setSellers(response.data);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const fetchAcceptedOrders = async () => {
    try {
      const response = await axiosInstance.get('/accepted-orders');
      setAcceptedOrders(response.data);
    } catch (error) {
      console.error('Error fetching accepted orders:', error);
    }
  };

  const handleAddRider = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newRider.name);
    formData.append('phoneNumber', newRider.phoneNumber);
    formData.append('identityPicture', newRider.identityPicture);

    try {
      await axiosInstance.post('/riders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchRiders();
      setNewRider({ name: '', phoneNumber: '', identityPicture: null });
    } catch (error) {
      console.error('Error adding rider:', error);
    }
  };

  const handleDeleteRider = async (riderId) => {
    try {
      await axiosInstance.delete(`/riders/${riderId}`);
      fetchRiders();
    } catch (error) {
      console.error('Error deleting rider:', error);
    }
  };

  const handleDeleteSeller = async (sellerId) => {
    try {
      await axiosInstance.delete(`/sellers/${sellerId}`);
      fetchSellers();
    } catch (error) {
      console.error('Error deleting seller:', error);
    }
  };

  const handleMarkOrderDone = async (orderId) => {
    try {
      await axiosInstance.put(`/orders/${orderId}/mark-assigned`);
      // Remove the order from the local state
      setAcceptedOrders(prevOrders => 
        prevOrders.filter(order => order.orderId !== orderId)
      );
    } catch (error) {
      console.error('Error marking order as done:', error);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Add Rider Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Add New Rider</h2>
          <form onSubmit={handleAddRider} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Rider Name"
                className="w-full p-2 border rounded"
                value={newRider.name}
                onChange={(e) => setNewRider({...newRider, name: e.target.value})}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Phone Number"
                className="w-full p-2 border rounded"
                value={newRider.phoneNumber}
                onChange={(e) => setNewRider({...newRider, phoneNumber: e.target.value})}
              />
            </div>
            <div>
              <input
                type="file"
                className="w-full p-2 border rounded"
                onChange={(e) => setNewRider({...newRider, identityPicture: e.target.files[0]})}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Rider
            </button>
          </form>
        </div>
    
        {/* Riders List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Riders</h2>
          <div className="space-y-4">
            {riders.map((rider) => (
              <div key={rider._id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{rider.name}</p>
                  <p className="text-sm text-gray-600">{rider.phoneNumber}</p>
                </div>
                <button
                  onClick={() => handleDeleteRider(rider._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
    
        {/* Sellers List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Sellers</h2>
          <div className="space-y-4">
            {sellers.map((seller) => (
              <div key={seller._id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{seller.shopName}</p>
                  <p className="text-sm text-gray-600">{seller.email}</p>
                  <div className="mt-1 text-sm">
                    <span className="mr-4">
                      Today's Orders: {seller.todayStats?.totalOrders || 0}
                    </span>
                    <span>
                      Today's Earnings: ₹{seller.todayStats?.totalEarnings || 0}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSeller(seller._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
    
        {/* Updated Accepted Orders Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Pending Delivery Orders</h2>
          <div className="space-y-4">
            {acceptedOrders.map((order) => (
              <div key={order.orderId} className="border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Buyer Details</h3>
                    <p>Name: {order.buyer.name}</p>
                    <p>Address: {order.buyer.address}</p>
                    <p>Phone: {order.buyer.phone}</p>
                    <a 
                      href={order.buyer.navigationLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Navigate to Buyer
                    </a>
                  </div>
                  <div>
                    <h3 className="font-medium">Seller Details</h3>
                    <p>Shop: {order.seller.shopName}</p>
                    <p>Address: {order.seller.address}</p>
                    <a 
                      href={order.seller.navigationLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Navigate to Seller
                    </a>
                  </div>
                </div>
                {/* <div className="mt-4">
                  <h3 className="font-medium">Order Details</h3>
                  <ul className="list-disc list-inside">
                    {order.products.map((product, index) => (
                      <li key={index}>
                        {product.name} x {product.quantity}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">Total Amount: ₹{order.totalPrice}</p>
                  <p>Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                </div> */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleMarkOrderDone(order.orderId)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Mark as Assigned
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}