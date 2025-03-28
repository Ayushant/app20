import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const secureStorage = {
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return await AsyncStorage.getItem(key);
    }
  },

  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
      await AsyncStorage.setItem(key, value);
    }
  },

  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
      await AsyncStorage.removeItem(key);
    }
  },

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