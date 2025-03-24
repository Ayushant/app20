import { useState } from "react"
import { View, TextInput, Button, StyleSheet, Text, Alert, ScrollView, ActivityIndicator } from "react-native"
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage'
import LocationPicker from '../components/LocationPicker'
import { API_URL } from '../config/api';
import secureStorage from '../config/secureStorage';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [shopName, setShopName] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [showMap, setShowMap] = useState(false)
  const [location, setLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    try {
      // Validate inputs
      if (!name || !email || !password || !shopName || !gstNumber || !location) {
        Alert.alert("Error", "Please fill in all fields including shop location")
        return
      }

      setIsLoading(true);
      const response = await axios.post(`${API_URL}/seller/register`, {
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

      // Store seller data securely after successful registration
      await secureStorage.setObject('sellerData', {
        id: response.data._id,
        token: response.data.token,
        name: response.data.name,
        email: response.data.email,
        location: response.data.location
      });

      Alert.alert(
        "Success",
        "Registration successful!",
        [{ text: "OK", onPress: () => navigation.replace("Home") }]
      )
    } catch (error) {
      console.error("Registration error:", error)
      
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.response) {
        // Handle specific error responses
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 409) {
          errorMessage = "Email already registered. Please use a different email.";
        } else if (error.response.status === 400) {
          errorMessage = "Invalid input data. Please check all fields.";
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      Alert.alert("Registration Error", errorMessage);
    } finally {
      setIsLoading(false);
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
        disabled={isLoading}
      />

      {location && (
        <Text style={styles.locationText}>
          Selected Location: {location.address}
        </Text>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Registering...</Text>
        </View>
      ) : (
        <>
          <Button title="Register" onPress={handleRegister} />
          <Button
            title="Already have an account? Login"
            onPress={() => navigation.navigate("Login")}
          />
        </>
      )}
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
  loadingContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#007AFF',
  }
});

