"use client"

import { useState } from "react"
import { View, TextInput, Button, StyleSheet, Text, Alert } from "react-native"
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import secureStorage from '../config/secureStorage';
import { isValidEmail, getEmailErrorMessage } from '../config/validation';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")

  const validateEmail = (text) => {
    setEmail(text);
    if (text && !isValidEmail(text)) {
      setEmailError(getEmailErrorMessage());
    } else {
      setEmailError("");
    }
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    
    if (!isValidEmail(email)) {
      Alert.alert("Error", getEmailErrorMessage());
      return;
    }
    
    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/seller/login`, {
        email,
        password,
      });

      // Store seller data using secure storage
      await secureStorage.setObject('sellerData', {
        id: response.data._id,
        token: response.data.token,
        name: response.data.name
      });

      navigation.replace("Home");
    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed. Please check your credentials.";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 401) {
          errorMessage = "Invalid email or password";
        } else if (error.response.status === 404) {
          errorMessage = "Account not found. Please register first.";
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      Alert.alert("Login Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seller App Login</Text>
      <TextInput
        style={[styles.input, emailError ? styles.inputError : null]}
        placeholder="Email"
        value={email}
        onChangeText={validateEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={isLoading ? "Loading..." : "Login"} onPress={handleLogin} disabled={isLoading} />
      <Button title="Don't have an account? Register" onPress={() => navigation.navigate("Register")} disabled={isLoading} />
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
    borderRadius: 5,
  },
  inputError: {
    borderColor: "red",
    borderWidth: 1,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
});

