import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useSelector, useDispatch } from 'react-redux';
import { updateQuantity, clearCart } from '../store/slices/cartSlice';

// API_URL='http://172.31.41.234:8000/api/'

// Add import
import FastImage from 'react-native-fast-image';

const AddressModal = ({ visible, onClose, onSubmit }) => {
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const data = JSON.parse(userDataString);
          setUserData(data);
          // Auto-fill name and address from user data
          setName(data.user?.name || '');
          setAddress(data.address || '');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (visible) {
      loadUserData();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delivery Details</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
              
              <TextInput
                style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Delivery Address"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={4}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    styles.confirmButton,
                    (!name.trim() || !address.trim()) && styles.disabledConfirmButton
                  ]}
                  onPress={() => onSubmit({ name, address })}
                  disabled={!name.trim() || !address.trim()}
                >
                  <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const [prescription, setPrescription] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  // if want to remove the delivery charge and platform fee
  const [deliveryCharge] = useState(25);
  const [platformFee] = useState(10);

  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

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
        navigation.replace('Auth', { returnScreen: 'Cart' });
        return;
      }

      // Check if prescription is required but not uploaded
      const requiresPrescription = cartItems.some(item => !item.isGeneral);
      if (requiresPrescription && !prescription) {
        Alert.alert(
          'Prescription Required',
          'Please upload a prescription for prescribed medicines before checkout.'
        );
        return;
      }

      setShowAddressModal(true);
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Failed to process checkout');
    }
  };

  const handleAddressSubmit = async ({ name, address }) => {
    try {
      setLoading(true);
      setShowAddressModal(false);

      const userDataString = await AsyncStorage.getItem('userData');
      const userData = JSON.parse(userDataString);

      // Create form data for order
      const formData = new FormData();
      formData.append('items', JSON.stringify(cartItems.map(item => ({
        ...item,
        requiresPrescription: !item.isGeneral
      }))));
      formData.append('totalPrice', totalPrice.toString());
      formData.append('deliveryCharge', deliveryCharge.toString());
      formData.append('platformFee', platformFee.toString());
      formData.append('address', address);
      formData.append('name', name);
      formData.append('contactNumber', userData.phoneNumber);

      // Only append prescription if any item requires it
      if (prescription && cartItems.some(item => !item.isGeneral)) {
        const prescriptionFile = {
          uri: prescription,
          type: 'image/jpeg',
          name: 'prescription.jpg'
        };
        formData.append('prescription', prescriptionFile);
      }

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

      dispatch(clearCart());

      Alert.alert(
        'Success',
        'Order placed successfully',
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('Orders')
          }
        ]
      );
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert('Error', 'Failed to place order');
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
    <>
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

      <AddressModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSubmit={handleAddressSubmit}
      />
    </>
  );
};

const additionalStyles = {
  disabledConfirmButton: {
    backgroundColor: '#a8e6a8',
  }
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  ...additionalStyles
});

export default CartScreen;

// Replace product image rendering in renderCartItem
{item.image && (
  <FastImage
    source={{ 
      uri: `${API_URL}/${item.image}`,
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable
    }}
    style={styles.productImage}
    resizeMode={FastImage.resizeMode.cover}
  />
)}