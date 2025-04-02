import React, { useState, useEffect, useCallback } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image, RefreshControl, TextInput } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { useFocusEffect } from '@react-navigation/native'
import { API_URL } from '../config/api'
import secureStorage from '../config/secureStorage'


export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [initialized, setInitialized] = useState(false)

  // Initial setup - only runs once
  useEffect(() => {
    const initialize = async () => {
      try {
        const savedTab = await AsyncStorage.getItem('activeProductTab')
        if (savedTab) {
          setActiveTab(savedTab)
        }
        setInitialized(true)
      } catch (error) {
        console.error("Error initializing:", error)
        setInitialized(true) // Continue even if there's an error
      }
    }
    
    initialize()
  }, [])

  // Filter products based on active tab and search query
  const filterProducts = useCallback((allProducts, tab, query) => {
    if (!allProducts || allProducts.length === 0) return []
    
    let result = [...allProducts]
    
    // Filter by tab (general/non-general)
    if (tab === 'general') {
      result = result.filter(product => product.isGeneral === true)
    } else if (tab === 'prescription') {
      result = result.filter(product => product.isGeneral === false)
    }
    
    // Filter by search query
    if (query) {
      const lowercasedQuery = query.toLowerCase()
      result = result.filter(product => 
        product.name.toLowerCase().includes(lowercasedQuery) ||
        (product.category && product.category.toLowerCase().includes(lowercasedQuery))
      )
    }
    
    return result
  }, [])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!initialized) return
    
    try {
      const sellerData = await secureStorage.getObject('sellerData')
      if (!sellerData) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.');
        navigation.replace('Login')
        return
      }
      
      // Ensure we have the latest tab setting
      const savedTab = await AsyncStorage.getItem('activeProductTab')
      const currentTab = savedTab || activeTab
      
      const response = await axios.get(
        `${API_URL}/seller/products/${sellerData.id}`,
        {
          headers: { Authorization: `Bearer ${sellerData.token}` }
        }
      )
      
      // Sort products alphabetically by name
      const sortedProducts = response.data.sort((a, b) => 
        a.name.localeCompare(b.name)
      )
      
      // Store all products
      setProducts(sortedProducts)
      
      // Filter and set filtered products
      const filtered = filterProducts(sortedProducts, currentTab, searchQuery)
      setFilteredProducts(filtered)
      
      // Make sure our tab state is correct
      if (savedTab && savedTab !== activeTab) {
        setActiveTab(savedTab)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      
      let errorMessage = "Failed to fetch products. Please try again.";
      
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
      setRefreshing(false)
    }
  }, [initialized, activeTab, searchQuery, filterProducts])

  // Handle tab change
  const handleTabChange = useCallback(async (tab) => {
    // Update state immediately for UI response
    setActiveTab(tab)
    
    // Save to storage
    try {
      await AsyncStorage.setItem('activeProductTab', tab)
    } catch (error) {
      console.error("Error saving tab selection:", error)
      // We don't need to alert the user for this non-critical error
    }
    
    // Apply filter immediately
    const filtered = filterProducts(products, tab, searchQuery)
    setFilteredProducts(filtered)
  }, [products, searchQuery, filterProducts])
  
  // Handle search input change
  const handleSearch = useCallback((text) => {
    setSearchQuery(text)
    const filtered = filterProducts(products, activeTab, text)
    setFilteredProducts(filtered)
  }, [products, activeTab, filterProducts])

  // Refresh products when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (initialized) {
        fetchProducts()
      }
    }, [fetchProducts, initialized])
  )

  // Also apply filters whenever products, tab or search query changes
  useEffect(() => {
    if (initialized && products.length > 0) {
      const filtered = filterProducts(products, activeTab, searchQuery)
      setFilteredProducts(filtered)
    }
  }, [products, activeTab, searchQuery, filterProducts, initialized])

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchProducts()
  }, [fetchProducts])

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        navigation.navigate("AddEditProduct", {
          product: item,
          onProductUpdate: fetchProducts
        })
      }}
    >
      <View style={styles.productInfo}>
        {item.image && (
          <Image
            source={{ uri: item.image }} // Updated: Using direct Cloudinary URL
            style={styles.productImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={[
            styles.productType, 
            { color: item.isGeneral ? '#4CAF50' : '#ff6b6b' }
          ]}>
            {item.isGeneral ? 'General' : 'Prescription Required'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Products</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]} 
          onPress={() => handleTabChange('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'general' && styles.activeTab]} 
          onPress={() => handleTabChange('general')}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>General</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'prescription' && styles.activeTab]} 
          onPress={() => handleTabChange('prescription')}
        >
          <Text style={[styles.tabText, activeTab === 'prescription' && styles.activeTabText]}>Prescription</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>
            {searchQuery 
              ? `No products found matching "${searchQuery}"` 
              : `No ${activeTab === 'all' ? '' : activeTab === 'general' ? 'general' : 'prescription'} products found`}
          </Text>
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
          onProductUpdate: fetchProducts
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
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeTab: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabText: {
    fontWeight: '500',
    color: '#333',
  },
  activeTabText: {
    color: 'white',
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
    marginBottom: 4,
  },
  productType: {
    fontSize: 12,
    fontWeight: '500',
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
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
})

const ProductItem = ({ product }) => (
  <TouchableOpacity
    style={styles.productItem}
    onPress={() => handleEditProduct(product)}
  >
    <Image
      source={{ uri: `${API_URL}/${product.image}` }}
      style={styles.productImage}
      resizeMode="cover"
    />
    {/* ... rest of the ProductItem component ... */}
  </TouchableOpacity>
);

