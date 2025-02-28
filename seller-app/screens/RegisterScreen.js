import { useState } from "react"
import { View, TextInput, Button, StyleSheet, Text } from "react-native"
import axios from "axios"

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [shopName, setShopName] = useState("")
  const [gstNumber, setGstNumber] = useState("")

  const handleRegister = async () => {
    try {
      console.log("Name", name)
      console.log("GST", gstNumber)
      const response = await axios.post('http://172.31.110.208:8000/api/seller/register', {
        name,
        email,
        password,
        shopName,
        gstNumber,
      })
      console.log("Registration successful:", response.data)
      navigation.navigate("Home")
    } catch (error) {
      console.error("Registration error:", error)
      // Handle error (e.g., show an alert)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seller Registration</Text>
      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Shop Name" value={shopName} onChangeText={setShopName} />
      <TextInput
        style={styles.input}
        placeholder="GST Number"
        value={gstNumber}
        onChangeText={setGstNumber}
      />
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
      <Button title="Register" onPress={handleRegister} />
      <Button title="Already have an account? Login" onPress={() => navigation.navigate("Login")} />
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

