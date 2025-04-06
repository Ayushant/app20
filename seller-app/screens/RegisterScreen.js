import { useState } from "react"
import { 
  View, 
  TextInput, 
  Button, 
  StyleSheet, 
  Text, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  Image
} from "react-native"
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage'
import LocationPicker from '../components/LocationPicker'
import { API_URL } from '../config/api';
import secureStorage from '../config/secureStorage';
import { isValidEmail, getEmailErrorMessage } from '../config/validation';
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [shopName, setShopName] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [showMap, setShowMap] = useState(false)
  const [location, setLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [qrCode, setQRCode] = useState(null);

  const validateEmail = (text) => {
    setEmail(text);
    if (text && !isValidEmail(text)) {
      setEmailError(getEmailErrorMessage());
    } else {
      setEmailError("");
    }
  };

  // Add QR code picker function
  const pickQRCode = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setQRCode(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking QR code:", error);
      Alert.alert("Error", "Failed to pick QR code image");
    }
  };

  const handleRegister = async () => {
    try {
      // Validate inputs
      if (!name) {
        Alert.alert("Error", "Please enter your full name");
        return;
      }
      
      if (!email) {
        Alert.alert("Error", "Please enter your email");
        return;
      }
      
      if (!isValidEmail(email)) {
        Alert.alert("Error", getEmailErrorMessage());
        return;
      }
      
      if (!password) {
        Alert.alert("Error", "Please enter a password");
        return;
      }
      
      if (!shopName) {
        Alert.alert("Error", "Please enter your shop name");
        return;
      }
      
      if (!gstNumber) {
        Alert.alert("Error", "Please enter your GST number");
        return;
      }
      
      if (!location) {
        Alert.alert("Error", "Please select your shop location");
        return;
      }

      if (!qrCode) {
        Alert.alert("Error", "Please upload your payment QR code");
        return;
      }

      setIsLoading(true);

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('shopName', shopName);
      formData.append('gstNumber', gstNumber);
      formData.append('location', JSON.stringify({
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address
      }));

      // Append QR code image
      const qrCodeUri = qrCode;
      const qrCodeFilename = qrCodeUri.split('/').pop();
      const match = /\.(\w+)$/.exec(qrCodeFilename);
      const type = match ? `image/${match[1]}` : 'image';

      formData.append('qrCode', {
        uri: qrCodeUri,
        name: qrCodeFilename,
        type
      });

      const response = await axios.post(`${API_URL}/seller/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

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

  // Add QR code upload UI in the return statement
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
        style={[styles.input, emailError ? styles.inputError : null]}
        placeholder="Email *"
        value={email}
        onChangeText={validateEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

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
            <View style={styles.qrCodeSection}>
        <Text style={styles.sectionTitle}>Payment QR Code *</Text>
        <TouchableOpacity 
          style={styles.qrCodeButton} 
          onPress={pickQRCode}
          disabled={isLoading}
        >
          <Text style={styles.qrCodeButtonText}>
            {qrCode ? "Change QR Code" : "Upload QR Code"}
          </Text>
        </TouchableOpacity>
        
        {qrCode && (
          <Image
            source={{ uri: qrCode }}
            style={styles.qrCodePreview}
            resizeMode="contain"
          />
        )}
      </View>
      

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
  },
  qrCodeSection: {
    marginVertical: 16,
    alignItems: 'center',
  },
  qrCodeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  qrCodeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  qrCodePreview: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
});

