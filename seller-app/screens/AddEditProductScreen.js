"use client"

import { useState, useEffect } from "react"
import { View, TextInput, Button, Image, StyleSheet, Alert, Text, Switch, ScrollView } from "react-native"
import * as ImagePicker from "expo-image-picker"
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config/api'

export default function AddEditProductScreen({ route, navigation }) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
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
      setIsGeneral(product.isGeneral || false)
      // Set image if available
      if (product.image) {
        setImage(`http://172.31.41.234:8000/${product.image}`)
      }
    }
    loadToken()
  }, [product])

  const loadToken = async () => {
    try {
      const sellerDataString = await AsyncStorage.getItem('sellerData')
      if (sellerDataString) {
        const sellerData = JSON.parse(sellerDataString)
        setToken(sellerData.token)
      }
    } catch (error) {
      console.error("Error loading token:", error)
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
        setImageChanged(true) // Flag that image has been changed
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      if (!name || !price) {
        Alert.alert("Error", "Please fill in all required fields")
        return
      }

      const sellerDataString = await AsyncStorage.getItem('sellerData')
      if (!sellerDataString) {
        navigation.replace('Login')
        return
      }

      const sellerData = JSON.parse(sellerDataString)
      const formData = new FormData()
      formData.append("name", name)
      formData.append("price", price)
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

      const response = await axios.post(
        product
          ? `${API_URL}/seller/edit-product/${product._id}`
          : `${API_URL}/seller/upload-product`,
        formData,
        config
      )

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
    } catch (error) {
      console.error("Save error:", error)
      Alert.alert("Error", "Failed to save product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
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

      <Button
        title={image ? "Change Image" : "Add Image"}
        onPress={pickImage}
      />

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <Button
            title="Remove Image"
            onPress={() => {
              setImage(null)
              setImageChanged(true)
            }}
            color="red"
          />
        </View>
      )}

      <Button
        title={loading ? "Saving..." : "Save Product"}
        onPress={handleSave}
        disabled={loading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
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
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 8,
    borderRadius: 8,
  },
})

