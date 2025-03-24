import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A utility for secure data storage in React Native
 * Uses Expo's SecureStore with fallback to AsyncStorage
 */
const secureStorage = {
  /**
   * Get data from secure storage
   * @param {string} key - The key to retrieve
   * @returns {Promise<string|null>} The stored value or null
   */
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      // Fallback to AsyncStorage if SecureStore fails
      return await AsyncStorage.getItem(key);
    }
  },

  /**
   * Store data in secure storage
   * @param {string} key - The key to store
   * @param {string} value - The value to store (must be a string)
   * @returns {Promise<void>}
   */
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(key, value);
    }
  },

  /**
   * Remove data from secure storage
   * @param {string} key - The key to remove
   * @returns {Promise<void>}
   */
  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.removeItem(key);
    }
  },

  /**
   * Get an object from secure storage (with JSON parsing)
   * @param {string} key - The key to retrieve
   * @returns {Promise<Object|null>} The stored object or null
   */
  getObject: async (key) => {
    const value = await secureStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error('Error parsing JSON from storage:', e);
        return null;
      }
    }
    return null;
  },

  /**
   * Store an object in secure storage (with JSON stringification)
   * @param {string} key - The key to store
   * @param {Object} value - The object to store
   * @returns {Promise<void>}
   */
  setObject: async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value);
      return await secureStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error('Error stringifying object for storage:', e);
    }
  }
};

export default secureStorage; 