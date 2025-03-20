"use client"

import { useState } from "react"
import { View, TextInput, Button, StyleSheet, Text, Alert } from "react-native"
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {
    try {
      console.log("email", email)
      const response = await axios.post(`${API_URL}/seller/login`, {
        email,
        password,
      });

      // Store seller data
      await AsyncStorage.setItem('sellerData', JSON.stringify({
        id: response.data._id,
        token: response.data.token,
        name: response.data.name
      }));

      navigation.navigate("Home");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Login failed. Please check your credentials.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seller App Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Don't have an account? Register" onPress={() => navigation.navigate("Register")} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
})

