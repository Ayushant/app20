import { useState } from "react"
import { View, TextInput, Button, StyleSheet, Text, Alert, ScrollView } from "react-native"
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage'
import LocationPicker from '../components/LocationPicker'

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [shopName, setShopName] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [showMap, setShowMap] = useState(false)
  const [location, setLocation] = useState(null)

  const handleRegister = async () => {
    try {
      // Validate inputs
      if (!name || !email || !password || !shopName || !gstNumber || !location) {
        Alert.alert("Error", "Please fill in all fields including shop location")
        return
      }

      console.log("Loacation", location)
      const response = await axios.post('http://172.31.110.208:8000/api/seller/register', {
        name,
        email,
        password,
        shopName,
        gstNumber,
        location: {
          type: 'Point',
          coordinates: location.coordinates,
          address: location.address
        }
      })

      // Store seller data in AsyncStorage after successful registration
      await AsyncStorage.setItem('sellerData', JSON.stringify({
        id: response.data._id,
        token: response.data.token,
        name: response.data.name,
        email: response.data.email,
        location: response.data.location
      }))

      Alert.alert(
        "Success",
        "Registration successful!",
        [{ text: "OK", onPress: () => navigation.navigate("Home") }]
      )
    } catch (error) {
      console.error("Registration error:", error)
      Alert.alert(
        "Error",
        error.response?.data?.message || "Registration failed. Please try again."
      )
    }
  }

  if (showMap) {
    return (
      <LocationPicker
        onLocationSelected={(loc) => {
          setLocation(loc)
          setShowMap(false)
        }}
      />
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seller Registration</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Shop Name *"
        value={shopName}
        onChangeText={setShopName}
      />

      <TextInput
        style={styles.input}
        placeholder="GST Number *"
        value={gstNumber}
        onChangeText={setGstNumber}
      />

      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title={location ? "Change Shop Location" : "Select Shop Location"}
        onPress={() => setShowMap(true)}
      />

      {location && (
        <Text style={styles.locationText}>
          Selected Location: {location.address}
        </Text>
      )}

      <Button title="Register" onPress={handleRegister} />
      <Button
        title="Already have an account? Login"
        onPress={() => navigation.navigate("Login")}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  locationText: {
    marginVertical: 10,
    color: '#666',
    fontSize: 14,
  },
});

