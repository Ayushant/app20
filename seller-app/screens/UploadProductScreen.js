"use client"
import React, { useState, useEffect } from 'react'
import { View, TextInput, Button, Image, StyleSheet, Text, Alert, ScrollView, TouchableOpacity, Switch } from "react-native"
import * as ImagePicker from "expo-image-picker"
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'http://172.31.41.234:8000/api'  // Replace with your actual API URL

export default function UploadProductScreen({ navigation }) {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("")
    const [isGeneral, setIsGeneral] = useState(false)
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
        if (!name || !description || !price || !category) {
            Alert.alert("Error", "Please fill all required fields")
            return
        }

        try {
            if (!sellerId) {
                Alert.alert("Error", "Seller authentication required")
                return
            }

            const formData = new FormData()
            formData.append("name", name)
            formData.append("price", price)
            formData.append("description", description)
            formData.append("category", category)
            formData.append("isGeneral", isGeneral)
            formData.append("sellerId", sellerId)

            if (image) {
                const imageFileName = image.split('/').pop()
                const imageType = "image/" + (imageFileName.split('.').pop() === 'png' ? 'png' : 'jpeg')

                formData.append("image", {
                    uri: image,
                    name: imageFileName,
                    type: imageType
                })
            }

            const response = await fetch(`${API_URL}/seller/upload-product`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            })

            const data = await response.json()
            if (response.ok) {
                Alert.alert("Success", "Product uploaded successfully", [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ])
            } else {
                Alert.alert("Error", data.error || "Failed to upload product")
            }
        } catch (error) {
            console.error("Upload error:", error)
            Alert.alert("Error", "Failed to upload product")
        }
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.label}>Medicine Name *</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter medicine name"
                />

                <Text style={styles.label}>Description *</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter medicine description, usage, etc."
                    multiline
                    numberOfLines={4}
                />

                <Text style={styles.label}>Price (₹) *</Text>
                <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="Enter price"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Category *</Text>
                <TextInput
                    style={styles.input}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="e.g., Antibiotics, Pain Relief, etc."
                />

                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Is General Medicine</Text>
                    <Switch
                        value={isGeneral}
                        onValueChange={setIsGeneral}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={isGeneral ? '#4CAF50' : '#f4f3f4'}
                    />
                </View>
                <Text style={[styles.helperText, { color: isGeneral ? '#4CAF50' : '#ff6b6b' }]}>
                    {isGeneral 
                        ? 'No prescription required for purchase' 
                        : 'Prescription will be required for purchase'
                    }
                </Text>

                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Text style={styles.imageButtonText}>
                        {image ? 'Change Medicine Image' : 'Upload Medicine Image'}
                    </Text>
                </TouchableOpacity>

                {image && (
                    <Image source={{ uri: image }} style={styles.previewImage} />
                )}

                <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
                    <Text style={styles.uploadButtonText}>Upload Medicine</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    form: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '600',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#f8f9fa',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    helperText: {
        fontSize: 14,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    imageButton: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    imageButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
    previewImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        marginBottom: 20,
        borderRadius: 8,
    },
    uploadButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})

