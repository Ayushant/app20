"use client"
import { useState, useEffect } from "react"
import { View, TextInput, Button, Image, StyleSheet, Text, Alert } from "react-native"
import * as ImagePicker from "expo-image-picker"
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function UploadProductScreen({ navigation }) {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("")
    const [image, setImage] = useState(null)
    const [sellerId, setSellerId] = useState(null)
    const [token, setToken] = useState(null)

    useEffect(() => {
        // Load seller data when component mounts
        const loadSellerData = async () => {
            try {
                const sellerDataString = await AsyncStorage.getItem('sellerData')
                if (sellerDataString) {
                    const sellerData = JSON.parse(sellerDataString)
                    setSellerId(sellerData.id)
                    setToken(sellerData.token)
                } else {
                    Alert.alert("Error", "Please login again")
                    navigation.navigate("Login")
                }
            } catch (error) {
                console.error("Error loading seller data:", error)
                navigation.navigate("Login")
            }
        }
        loadSellerData()
    }, [])

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        })

        if (!result.canceled) {
            setImage(result.assets[0].uri)
        }
    }

    const handleUpload = async () => {
        try {
            if (!name || !price || !category) {
                Alert.alert("Error", "Please fill all required fields")
                return
            }

            if (!sellerId) {
                Alert.alert("Error", "Seller authentication required")
                return
            }

            const formData = new FormData()
            formData.append("name", name)
            formData.append("price", price)
            formData.append("description", description)
            formData.append("category", category)
            formData.append("sellerId", sellerId)

            if (image) {
                const imageFileName = image.split('/').pop()
                const imageType = "image/" + imageFileName.split('.').pop()

                formData.append("image", {
                    uri: image,
                    name: imageFileName,
                    type: imageType
                })
            }

            const response = await axios.post(
                'http://172.31.110.208:8000/api/seller/upload-product',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    },
                }
            )

            Alert.alert("Success", "Product uploaded successfully")
            navigation.navigate("Home")
        } catch (error) {
            console.error("Upload error:", error)
            Alert.alert("Error", "Failed to upload product")
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Upload New Product</Text>
            <TextInput
                style={styles.input}
                placeholder="Product Name *"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Price *"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Category *"
                value={category}
                onChangeText={setCategory}
            />
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                multiline
            />
            <Button title="Pick an image" onPress={pickImage} />
            {image && <Image source={{ uri: image }} style={styles.image} />}
            <Button title="Upload Product" onPress={handleUpload} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: "gray",
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    image: {
        width: 200,
        height: 200,
        resizeMode: "contain",
        alignSelf: "center",
        marginVertical: 16,
    },
})

