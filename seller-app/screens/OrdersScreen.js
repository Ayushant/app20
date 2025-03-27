import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Image,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from "react-native";
import axios from 'axios';
import { API_URL } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import secureStorage from '../config/secureStorage';
// Add import
import FastImage from 'react-native-fast-image'

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(page === 1);
      if (page > 1) {
        setIsLoadingMore(true);
      }

      const sellerData = await secureStorage.getObject('sellerData');
      if (!sellerData) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.');
        navigation.replace('Login');
        return;
      }

      const response = await axios.get(
        `${API_URL}/seller/orders/${sellerData.id}?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${sellerData.token}` }
        }
      );
      
      if (page === 1) {
        setOrders(response.data.orders);
      } else {
        setOrders(prevOrders => [...prevOrders, ...response.data.orders]);
      }
      
      setCurrentPage(response.data.currentPage);
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error("Error fetching orders:", error);
      
      let errorMessage = "Failed to load orders. Please try again.";
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Your session has expired. Please login again.";
          await secureStorage.removeItem('sellerData');
          navigation.replace('Login');
          return;
        }
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreOrders = () => {
    if (!hasMore || isLoadingMore) return;
    fetchOrders(currentPage + 1);
  };

  const handleOrderAction = async (orderId, action) => {
    try {
      const sellerData = await secureStorage.getObject('sellerData');
      if (!sellerData) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.');
        navigation.replace('Login');
        return;
      }

      await axios.put(
        `${API_URL}/seller/order/${orderId}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${sellerData.token}` }
        }
      );

      Alert.alert("Success", `Order ${action}ed successfully`);
      fetchOrders(1); // Refresh orders list from the first page
    } catch (error) {
      console.error("Error updating order:", error);
      
      let errorMessage = `Failed to ${action} order. Please try again.`;
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Your session has expired. Please login again.";
          await secureStorage.removeItem('sellerData');
          navigation.replace('Login');
          return;
        }
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      Alert.alert("Error", errorMessage);
    }
  };

  const renderPrescriptionImage = (prescription) => {
    if (!prescription) return null;

    // Get the correct image URL by removing 'uploads/' if it exists in the path
    const prescriptionPath = prescription.replace('uploads/', '');
    const imageUrl = `${API_URL}/uploads/prescriptions/${prescriptionPath}`;

    return (
      <TouchableOpacity
        onPress={() => setSelectedImage(imageUrl)}
        style={styles.prescriptionContainer}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.prescriptionThumbnail}
        />
        <Text style={styles.viewPrescriptionText}>View Prescription</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.orderInfo}>
        <Text style={styles.customerName}>Order ID: {item._id}</Text>
        <Text style={styles.orderDetail}>Customer: {item.buyerId.name}</Text>
        <Text style={styles.orderDetail}>Total: ₹{item.totalPrice}</Text>
        <Text style={styles.orderDetail}>Status: {item.status}</Text>
        <Text style={styles.orderDetail}>Address: {item.address}</Text>
        
        {item.products.map((product, index) => (
          <View key={index} style={styles.productItem}>
            <Text>• {product.productId.name} x {product.quantity}</Text>
            {product.requiresPrescription && (
              <Text style={styles.prescriptionRequired}>Prescription Required</Text>
            )}
          </View>
        ))}

        {/* Show prescription if any product requires it */}
        {item.products.some(product => product.requiresPrescription) && 
          renderPrescriptionImage(item.prescription)}
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleOrderAction(item._id, 'accept')}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleOrderAction(item._id, 'reject')}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const ImagePreviewModal = () => (
    <Modal
      visible={!!selectedImage}
      transparent={true}
      onRequestClose={() => setSelectedImage(null)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => setSelectedImage(null)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Image
          source={{ uri: selectedImage }}
          style={styles.fullImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#4CAF50" />
        <Text style={styles.footerText}>Loading more orders...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={() => fetchOrders(1)}
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>No orders found</Text>
        }
      />
      <ImagePreviewModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  item: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  orderInfo: {
    marginBottom: 10,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orderDetail: {
    fontSize: 16,
    marginBottom: 4,
    color: '#666',
  },
  productItem: {
    marginLeft: 10,
    marginTop: 5,
  },
  prescriptionRequired: {
    color: '#ff6b6b',
    fontSize: 12,
    marginLeft: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  prescriptionContainer: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
  },
  prescriptionThumbnail: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  viewPrescriptionText: {
    color: '#1976d2',
    marginTop: 5,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  footerText: {
    marginLeft: 10,
    color: '#666',
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});

export default OrdersScreen;

// Update prescription image rendering
<FastImage
  source={{ 
    uri: imageUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable
  }}
  style={styles.prescriptionThumbnail}
  resizeMode={FastImage.resizeMode.cover}
/>

