import React, { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image, RefreshControl } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { useFocusEffect } from '@react-navigation/native'

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchProducts = async () => {
    try {
      const sellerDataString = await AsyncStorage.getItem('sellerData')
      if (!sellerDataString) {
        navigation.navigate('Login')
        return
      }

      const sellerData = JSON.parse(sellerDataString)
      const response = await axios.get(
        `http://172.31.110.208:8000/api/seller/products/${sellerData.id}`
      )
      setProducts(response.data)
    } catch (error) {
      console.error("Error fetching products:", error)
      Alert.alert("Error", "Failed to load products")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Refresh products when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProducts()
    }, [])
  )

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    fetchProducts()
  }, [])

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        navigation.navigate("AddEditProduct", {
          product: item,
          onProductUpdate: fetchProducts // Pass the refresh callback
        })
      }}
    >
      <View style={styles.productInfo}>
        {item.image && (
          <Image
            source={{ uri: `http://172.31.110.208:8000/${item.image}` }}
            style={styles.productImage}
          />
        )}
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading products...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Products</Text>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No products found</Text>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddEditProduct", {
          onProductUpdate: fetchProducts // Pass the refresh callback
        })}
      >
        <Text style={styles.addButtonText}>Add Product</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  item: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: '#2E7D32',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
})

