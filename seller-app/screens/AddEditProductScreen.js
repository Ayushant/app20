"use client"

import { useState, useEffect } from "react"
import { View, TextInput, Button, Image, StyleSheet, Alert, Text, Switch, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import * as ImagePicker from "expo-image-picker"
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config/api'
import secureStorage from '../config/secureStorage'

export default function AddEditProductScreen({ route, navigation }) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [image, setImage] = useState(null)
  const [imageChanged, setImageChanged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isGeneral, setIsGeneral] = useState(false)
  const { product, onProductUpdate } = route.params || {}
  const [token, setToken] = useState(null)

  useEffect(() => {
    if (product) {
      setName(product.name)
      setPrice(product.price.toString())
      setDescription(product.description || "")
      setCategory(product.category || "")
      setIsGeneral(product.isGeneral || false)
      // Set image if available
      if (product.image) {
        setImage(`${API_URL}/${product.image}`)
      }
    }
    loadToken()
  }, [product])

  const loadToken = async () => {
    try {
      const sellerData = await secureStorage.getObject('sellerData')
      if (sellerData) {
        setToken(sellerData.token)
      } else {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.');
        navigation.replace('Login');
      }
    } catch (error) {
      console.error("Error loading token:", error)
      Alert.alert('Error', 'Failed to load authentication data. Please login again.');
      navigation.replace('Login');
    }
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      })

      if (!result.canceled) {
        setImage(result.assets[0].uri)
        setImageChanged(true)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      if (!name || !price || !description || !category) {
        Alert.alert("Error", "Please fill in all required fields")
        setLoading(false)
        return
      }

      const sellerData = await secureStorage.getObject('sellerData')
      if (!sellerData) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.');
        navigation.replace('Login')
        return
      }

      const formData = new FormData()
      formData.append("name", name)
      formData.append("price", price)
      formData.append("description", description)
      formData.append("category", category)
      formData.append("isGeneral", isGeneral.toString())
      formData.append("sellerId", sellerData.id)

      // Only append image if it's a new image or has been changed
      if (imageChanged && image) {
        const imageUri = image
        const filename = imageUri.split('/').pop()
        const match = /\.(\w+)$/.exec(filename)
        const type = match ? `image/${match[1]}` : 'image'

        formData.append("image", {
          uri: imageUri,
          name: filename,
          type
        })
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${sellerData.token}`
        }
      }

      let response;
      if (product) {
        // Update existing product
        response = await axios.put(
          `${API_URL}/seller/edit-product/${product._id}`,
          formData,
          config
        )
      } else {
        // Add new product
        response = await axios.post(
          `${API_URL}/seller/upload-product`,
          formData,
          config
        )
      }

      if (response.status === 200 || response.status === 201) {
        // Call the refresh callback if provided
        if (onProductUpdate) {
          await onProductUpdate()
        }

        Alert.alert(
          "Success",
          product ? "Product updated successfully" : "Product uploaded successfully",
          [{
            text: "OK",
            onPress: () => navigation.goBack()
          }]
        )
      }
    } catch (error) {
      console.error("Save error:", error)
      
      // Improved error handling
      let errorMessage = "Failed to save product. Please try again.";
      
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
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {product ? "Edit Product" : "Add New Product"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Product Name *"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description *"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TextInput
        style={styles.input}
        placeholder="Category *"
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        style={styles.input}
        placeholder="Price *"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Is General Medicine</Text>
        <Switch
          value={isGeneral}
          onValueChange={setIsGeneral}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isGeneral ? '#4CAF50' : '#f4f3f4'}
        />
      </View>
      <Text style={[styles.helperText, { color: isGeneral ? '#4CAF50' : '#ff6b6b' }]}>
        {isGeneral 
          ? 'No prescription required for purchase' 
          : 'Prescription will be required for purchase'
        }
      </Text>

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>
          {image ? 'Change Image' : 'Add Image'}
        </Text>
      </TouchableOpacity>

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => {
              setImage(null)
              setImageChanged(true)
            }}
          >
            <Text style={styles.removeButtonText}>Remove Image</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabledButton]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {product ? "Update Product" : "Add Product"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 20,
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  imageButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imageButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: "cover",
    marginBottom: 8,
    borderRadius: 8,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

