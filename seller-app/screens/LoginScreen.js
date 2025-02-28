"use client"

import { useState } from "react"
import { View, TextInput, Button, StyleSheet, Text } from "react-native"
import axios from "axios"

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {
    try {
      console.log("email", email)
      const response = await axios.post('http://172.31.110.208:8000/api/seller/register', {
        email,
        password,
      });
      console.log("Login successful:", response.data);
      navigation.navigate("Home");
    } catch (error) {
      console.error("Login error:", error);
      // Handle error (e.g., show an alert)
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

