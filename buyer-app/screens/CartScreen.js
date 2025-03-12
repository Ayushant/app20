import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useSelector, useDispatch } from 'react-redux';
import { updateQuantity, clearCart } from '../store/slices/cartSlice';

// API_URL='http://172.31.41.234:8000/api/'

const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const [prescription, setPrescription] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  // if want to remove the delivery charge and platform fee
  const [deliveryCharge] = useState(25);
  const [platformFee] = useState(10);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateTotal();
  }, [cartItems]);

  const calculateTotal = () => {
    const itemsTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalPrice(itemsTotal);
  };

  const updateItemQuantity = (itemId, change) => {
    dispatch(updateQuantity({ itemId, change }));
  };

  const pickPrescription = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPrescription(result.assets[0].uri);
    }
  };

  const handleCheckout = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        navigation.replace('Login', { returnScreen: 'Cart' });
        return;
      }

      const userData = JSON.parse(userDataString);
      const requiresPrescription = cartItems.some(item => !item.isGeneral);
      
      // handling prescription
      if (requiresPrescription && !prescription) {
        Alert.alert('Prescription Required', 'Please upload prescription for prescribed medicines');
        return;
      }

      setLoading(true);

      // Create form data for order
      const formData = new FormData();
      formData.append('items', JSON.stringify(cartItems));
      formData.append('totalPrice', totalPrice.toString());
      formData.append('deliveryCharge', deliveryCharge.toString());
      formData.append('platformFee', platformFee.toString());

      // TODO: Handle user address
      formData.append('address', 'User Address'); // Add actual address handling

      // Append prescription if exists
      if (prescription) {
        const prescriptionFile = {
          uri: prescription,
          type: 'image/jpeg',
          name: 'prescription.jpg'
        };
        formData.append('prescription', prescriptionFile);
      }

      // Place order
      const response = await axios.post(
        `${API_URL}/buyer/order/place`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );

      // Clear cart after successful order
      dispatch(clearCart());

      Alert.alert(
        'Success',
        'Order placed successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Orders')
          }
        ]
      );
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyCartContainer}>
      <Ionicons name="cart-outline" size={80} color="#ccc" />
      <Text style={styles.emptyCartText}>Your cart is empty</Text>
      <TouchableOpacity 
        style={styles.shopNowButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopNowButtonText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <ScrollView>
            {/* Cart Items */}
            {cartItems.map((item, index) => (
              <View key={index} style={styles.cartItem}>
                <Image 
                  source={{ uri: `${API_URL}/${item.image}` }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price}</Text>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity onPress={() => updateItemQuantity(item._id, -1)}>
                      <Text style={styles.quantityButton}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateItemQuantity(item._id, 1)}>
                      <Text style={styles.quantityButton}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Prescription Upload Section */}
            {cartItems.some(item => !item.isGeneral) && (
              <View style={styles.prescriptionSection}>
                <Text style={styles.sectionTitle}>Upload Prescription</Text>
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={pickPrescription}
                >
                  <Text style={styles.uploadButtonText}>
                    {prescription ? 'Change Prescription' : 'Upload Prescription'}
                  </Text>
                </TouchableOpacity>
                {prescription && (
                  <Image 
                    source={{ uri: prescription }}
                    style={styles.prescriptionPreview}
                  />
                )}
              </View>
            )}

            {/* Price Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text>Price</Text>
                <Text>₹{totalPrice}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Delivery Charge</Text>
                <Text>₹{deliveryCharge}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Platform fee</Text>
                <Text>₹{platformFee}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalText}>Total</Text>
                <Text style={styles.totalAmount}>
                  ₹{totalPrice + deliveryCharge + platformFee}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Checkout Button */}
          <TouchableOpacity 
            style={[styles.checkoutButton, loading && styles.disabledButton]}
            onPress={handleCheckout}
            disabled={loading || cartItems.length === 0}
          >
            <Text style={styles.checkoutButtonText}>
              {loading ? 'Processing...' : 'Checkout'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50, // Add top margin
  },
  cartItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    fontSize: 20,
    paddingHorizontal: 15,
    color: '#007AFF',
  },
  quantity: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  prescriptionSection: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    margin: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  prescriptionPreview: {
    width: '100%',
    height: 200,
    marginTop: 15,
    borderRadius: 8,
  },
  summary: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    margin: 15,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen;