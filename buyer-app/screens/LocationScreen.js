import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import * as Location from 'expo-location';
import secureStorage from '../config/secureStorage';
import axios from 'axios';
import { API_URL } from '../config/api';
import { Ionicons } from '@expo/vector-icons';

const LocationScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [houseNumber, setHouseNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [manualInput, setManualInput] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setManualInput(true);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        coordinates: [location.coords.longitude, location.coords.latitude]
      });

      // Get address from coordinates
      const response = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (response[0]) {
        const addressComponents = response[0];
        setStreetName(addressComponents.street || '');
        setLandmark(addressComponents.name || '');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please enter your address manually.',
        [{ text: 'OK' }]
      );
      setManualInput(true);
    } finally {
      setLoading(false);
    }
  };

  const saveLocation = async () => {
    try {
      setLoading(true);
      const userData = await secureStorage.getObject('userData');
      if (!userData) {
        navigation.replace('Auth', { returnScreen: 'Location' });
        return;
      }

      const { token } = JSON.parse(userData);
      
      // Format the complete address
      const formattedAddress = `${houseNumber ? houseNumber + ', ' : ''}${streetName}${landmark ? ', Near ' + landmark : ''}`;
      
      // Prepare location data
      const locationData = {
        address: formattedAddress,
        location: {
          type: 'Point',
          coordinates: currentLocation ? currentLocation.coordinates : [0, 0]
        }
      };

      // Update user's location in the backend
      await axios.put(
        `${API_URL}/buyer/update-location`,
        locationData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update stored user data
      const updatedUserData = { ...userData, address: formattedAddress, location: locationData.location };
      await secureStorage.setObject('userData', updatedUserData);

      // Navigate back or to home
      if (route.params?.returnScreen) {
        navigation.replace(route.params.returnScreen);
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return streetName.trim() !== '';
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Your Location</Text>
          <Text style={styles.subtitle}>
            We need your location to show nearby medical stores
          </Text>
        </View>

        {!manualInput && (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            <Ionicons name="location" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>
              {loading ? 'Getting Location...' : 'Use Current Location'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="House Number (Optional)"
            value={houseNumber}
            onChangeText={setHouseNumber}
            keyboardType="default"
          />
          <TextInput
            style={styles.input}
            placeholder="Street Name *"
            value={streetName}
            onChangeText={setStreetName}
            keyboardType="default"
          />
          <TextInput
            style={styles.input}
            placeholder="Landmark (Optional)"
            value={landmark}
            onChangeText={setLandmark}
            keyboardType="default"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <TouchableOpacity
            style={[styles.saveButton, !isFormValid() && styles.disabledButton]}
            onPress={saveLocation}
            disabled={!isFormValid()}
          >
            <Text style={styles.saveButtonText}>Save Location</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 10,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
});

export default LocationScreen;