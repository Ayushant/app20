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
  Dimensions
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';
import { Ionicons } from '@expo/vector-icons';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const sellerDataString = await AsyncStorage.getItem('sellerData');
      if (!sellerDataString) {
        navigation.replace('Login');
        return;
      }

      const sellerData = JSON.parse(sellerDataString);
      const response = await axios.get(
        `${API_URL}/seller/orders/${sellerData.id}`,
        {
          headers: { Authorization: `Bearer ${sellerData.token}` }
        }
      );
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderAction = async (orderId, action) => {
    try {
      const sellerDataString = await AsyncStorage.getItem('sellerData');
      if (!sellerDataString) {
        navigation.replace('Login');
        return;
      }

      const sellerData = JSON.parse(sellerDataString);
      await axios.put(
        `${API_URL}/seller/order/${orderId}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${sellerData.token}` }
        }
      );

      Alert.alert("Success", `Order ${action}ed successfully`);
      fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", `Failed to ${action} order`);
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

  if (loading) {
    return (
      <View style={styles.container}>
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
        onRefresh={fetchOrders}
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
});

export default OrdersScreen;

