import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        navigation.replace('Auth', { returnScreen: 'Orders' });
        return;
      }

      const { token } = JSON.parse(userData);
      const response = await axios.get(`${API_URL}/buyer/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert(
        'Error',
        'Failed to fetch orders. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Add navigation listener to refresh orders when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#f44336';
      case 'pending': return '#FFA000';
      default: return '#FFA000';
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'shipped': return '#2196F3';
      case 'preparing': return '#FFA000';
      default: return '#FFA000';
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No orders yet</Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order ID: {item._id}</Text>
          <Text style={styles.orderDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.sellerInfo}>
        <Ionicons name="business-outline" size={16} color="#666" />
        <Text style={styles.sellerName}>{item.sellerId.shopName}</Text>
      </View>
      
      {item.products.map((product, index) => (
        <View key={index} style={styles.productItem}>
          <Text style={styles.productName}>{product.productId.name}</Text>
          <View style={styles.productDetails}>
            <Text style={styles.productQuantity}>Qty: {product.quantity}</Text>
            <Text style={styles.productPrice}>₹{product.productId.price * product.quantity}</Text>
          </View>
          {product.requiresPrescription && (
            <Text style={styles.prescriptionRequired}>Prescription Required</Text>
          )}
        </View>
      ))}
      
      <View style={styles.orderFooter}>
        <View style={styles.orderDetails}>
          <Text style={styles.address}>Delivery to: {item.address}</Text>
          <Text style={styles.total}>Total: ₹{item.totalPrice}</Text>
        </View>
        
        <View style={[styles.deliveryStatusBadge, { backgroundColor: getDeliveryStatusColor(item.deliveryStatus) + '20' }]}>
          <Text style={[styles.deliveryStatus, { color: getDeliveryStatusColor(item.deliveryStatus) }]}>
            {item.deliveryStatus.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Your Orders</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={orders.length === 0 ? styles.emptyList : styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 8,
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    color: '#666',
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sellerName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  productItem: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  prescriptionRequired: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 2,
  },
  orderFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  orderDetails: {
    flex: 1,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  deliveryStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  deliveryStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrdersScreen; 