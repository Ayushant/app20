// import React from 'react';
// import { View, Text, Button, StyleSheet } from 'react-native';

// const HomeScreen = ({ navigation }) => {
//     return (
//         <View style={styles.container}>
//             <Text style={styles.title}>Welcome to the Seller Dashboard</Text>
//             <View style={styles.buttonContainer}>
//                 <Button
//                     title="Upload Product"
//                     onPress={() => navigation.navigate('UploadProduct')}
//                 />
//                 <View style={styles.buttonSpacing} />
//                 <Button
//                     title="View Products"
//                     onPress={() => navigation.navigate('ProductList')}
//                 />
//                 <Button
//                     title="Order List"
//                     onPress={() => navigation.navigate('OrderList')}
//                 />
//                 <View style={styles.buttonSpacing} />
//             </View>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#f8f9fa',
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 20,
//     },
//     buttonContainer: {
//         width: '80%',
//     },
//     buttonSpacing: {
//         height: 10,
//     }
// });

// export default HomeScreen; 


"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import axios from "axios"

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sellerData, setSellerData] = useState(null)

  useEffect(() => {
    fetchSellerData()
  }, [])

  const fetchSellerData = async () => {
    try {
      setLoading(true)
      // Replace with your actual API endpoint
      const response = await axios.get("")
      setSellerData(response.data)
      setLoading(false)
    } catch (err) {
      setError("Failed to fetch seller data")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B8B" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSellerData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {sellerData?.storeName || "Seller"}</Text>
          <Text style={styles.subGreeting}>Welcome back!</Text>
        </View>
        <Image
          source={{ uri: sellerData?.profilePicture || "https://via.placeholder.com/40" }}
          style={styles.profilePic}
        />
      </View>

      {/* Total Earnings Card */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsAmount}>${sellerData?.totalEarnings?.toFixed(2) || "0.00"}</Text>
      </View>

      {/* Analytics Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.analyticsContainer}>
        {sellerData?.analytics?.length > 0 ? (
          sellerData.analytics.map((item, index) => (
            <View key={index} style={[styles.analyticsCard, { backgroundColor: item.color }]}>
              <Text style={styles.analyticsValue}>{item.value}</Text>
              <Text style={styles.analyticsTitle}>{item.title}</Text>
              <Text style={styles.analyticsSubtext}>{item.subtext}</Text>
            </View>
          ))
        ) : (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>No analytics data available</Text>
          </View>
        )}
      </ScrollView>

      {/* Top Selling Products */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Top Selling Products</Text>
        {sellerData?.topProducts?.length > 0 ? (
          sellerData.topProducts.map((product, index) => (
            <View key={index} style={styles.productItem}>
              <View style={styles.productInfo}>
                <View style={[styles.productIcon, { backgroundColor: "#FF4B8B" }]}>
                  <MaterialCommunityIcons name="shopping" size={20} color="white" />
                </View>
                <Text style={styles.productName}>{product.name}</Text>
              </View>
              <Text style={styles.salesCount}>{product.sales} Sales</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No top selling products available</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("UploadProduct")}>
          <Text style={styles.buttonText}>Upload Product</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ProductList")}>
          <Text style={styles.buttonText}>View Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("OrderList")}>
          <Text style={styles.buttonText}>Order List</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subGreeting: {
    fontSize: 16,
    color: "#666",
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  earningsCard: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  earningsLabel: {
    fontSize: 16,
    color: "#666",
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF4B8B",
    marginTop: 8,
  },
  analyticsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  analyticsCard: {
    width: 150,
    padding: 15,
    borderRadius: 15,
    marginRight: 15,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  analyticsTitle: {
    fontSize: 14,
    color: "white",
    opacity: 0.8,
    marginTop: 4,
  },
  analyticsSubtext: {
    fontSize: 12,
    color: "white",
    opacity: 0.6,
    marginTop: 4,
  },
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  productName: {
    fontSize: 16,
  },
  salesCount: {
    fontSize: 14,
    color: "#666",
  },
  buttonContainer: {
    width: "80%",
    alignSelf: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FF4B8B",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#FF4B8B",
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
  },
  noDataCard: {
    width: 150,
    padding: 15,
    borderRadius: 15,
    marginRight: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    color: "#666",
    textAlign: "center",
  },
})

export default HomeScreen



