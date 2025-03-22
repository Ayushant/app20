"use client"
import React, { useState, useEffect } from 'react'
import { View, TextInput, Button, Image, StyleSheet, Text, Alert, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from "react-native"
import * as ImagePicker from "expo-image-picker"
import * as DocumentPicker from 'expo-document-picker'
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config/api'
import * as FileSystem from 'expo-file-system'
import { Ionicons } from '@expo/vector-icons'

export default function UploadProductScreen({ navigation }) {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("")
    const [isGeneral, setIsGeneral] = useState(false)
    const [image, setImage] = useState(null)
    const [sellerId, setSellerId] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(false)
    const [uploadMode, setUploadMode] = useState('single') // 'single' or 'bulk'
    const [selectedFile, setSelectedFile] = useState(null)

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
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            })

            if (!result.canceled) {
                setImage(result.assets[0].uri)
            }
        } catch (error) {
            console.error("Error picking image:", error)
            Alert.alert("Error", "Failed to pick image")
        }
    }

    const pickExcelFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/csv'
                ]
            })

            if (result.assets && result.assets[0]) {
                setSelectedFile(result.assets[0])
                Alert.alert('Success', 'File selected successfully')
            }
        } catch (error) {
            console.error("Error picking file:", error)
            Alert.alert("Error", "Failed to pick Excel file")
        }
    }

    const downloadTemplate = async () => {
        try {
            setLoading(true);
            const response = await axios({
                url: `${API_URL}/seller/download-template`,
                method: 'GET',
                headers: { 
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'arraybuffer'
            });
            
            const fileName = 'product_upload_template.xlsx';
            const fileUri = FileSystem.documentDirectory + fileName;
            
            await FileSystem.writeAsStringAsync(
                fileUri,
                arrayBufferToBase64(response.data),
                { encoding: FileSystem.EncodingType.Base64 }
            );
            
            Alert.alert(
                "Success",
                `Template downloaded successfully and saved as ${fileName}`,
                [{ text: "OK" }]
            );
        } catch (error) {
            console.error("Template download error:", error);
            Alert.alert("Error", "Failed to download template");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to convert ArrayBuffer to Base64
    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    const handleBulkUpload = async () => {
        if (!selectedFile) {
            Alert.alert("Error", "Please select an Excel file first")
            return
        }

        try {
            setLoading(true)
            const formData = new FormData()
            formData.append('file', {
                uri: selectedFile.uri,
                name: selectedFile.name,
                type: selectedFile.mimeType
            })
            formData.append('sellerId', sellerId)

            const response = await axios.post(
                `${API_URL}/seller/bulk-upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            if (response.status === 201) {
                Alert.alert(
                    "Success",
                    `${response.data.successCount} products uploaded successfully${response.data.errorCount ? `\n${response.data.errorCount} products failed` : ''}`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                )
            }
        } catch (error) {
            console.error("Bulk upload error:", error)
            Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to upload products. Please check your Excel file and try again."
            )
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!name || !description || !price || !category) {
            Alert.alert("Error", "Please fill all required fields")
            return
        }

        try {
            setLoading(true)
            if (!sellerId) {
                Alert.alert("Error", "Seller authentication required")
                return
            }

            const formData = new FormData()
            formData.append("name", name)
            formData.append("price", price)
            formData.append("description", description)
            formData.append("category", category)
            formData.append("isGeneral", isGeneral.toString())
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

            const response = await axios.post(
                `${API_URL}/seller/upload-product`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            if (response.status === 201) {
                Alert.alert(
                    "Success", 
                    "Product uploaded successfully",
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                )
            }
        } catch (error) {
            console.error("Upload error:", error)
            Alert.alert(
                "Error", 
                error.response?.data?.message || "Failed to upload product. Please try again."
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView style={styles.container}>
            {/* Upload Mode Selector */}
            <View style={styles.uploadModeContainer}>
                <TouchableOpacity 
                    style={[styles.modeButton, uploadMode === 'single' && styles.activeModeButton]}
                    onPress={() => setUploadMode('single')}
                >
                    <Text style={[styles.modeButtonText, uploadMode === 'single' && styles.activeModeButtonText]}>
                        Single Upload
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.modeButton, uploadMode === 'bulk' && styles.activeModeButton]}
                    onPress={() => setUploadMode('bulk')}
                >
                    <Text style={[styles.modeButtonText, uploadMode === 'bulk' && styles.activeModeButtonText]}>
                        Bulk Upload
                    </Text>
                </TouchableOpacity>
            </View>

            {uploadMode === 'single' ? (
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

                    <TouchableOpacity 
                        style={[styles.uploadButton, loading && styles.disabledButton]} 
                        onPress={handleUpload}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.uploadButtonText}>Upload Medicine</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.bulkUploadContainer}>
                    <Text style={styles.bulkUploadTitle}>Bulk Upload Products</Text>
                    
                    <Text style={styles.bulkUploadDescription}>
                        Download the template, fill in your product details, and upload the file to add multiple products at once.
                    </Text>

                    <TouchableOpacity 
                        style={styles.templateButton} 
                        onPress={downloadTemplate}
                    >
                        <Ionicons name="download-outline" size={24} color="#007AFF" />
                        <Text style={styles.templateButtonText}>Download Template</Text>
                    </TouchableOpacity>

                    <View style={styles.fileUploadSection}>
                        <TouchableOpacity 
                            style={styles.filePickerButton} 
                            onPress={pickExcelFile}
                        >
                            <Ionicons name="document-outline" size={24} color="#007AFF" />
                            <Text style={styles.filePickerText}>
                                {selectedFile ? selectedFile.name : 'Select Excel File'}
                            </Text>
                        </TouchableOpacity>

                        {selectedFile && (
                            <TouchableOpacity 
                                style={[styles.uploadButton, loading && styles.disabledButton]} 
                                onPress={handleBulkUpload}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.uploadButtonText}>Upload Products</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsTitle}>Template Format:</Text>
                        <Text style={styles.instructionsText}>
                            • Name (required){'\n'}
                            • Description (required){'\n'}
                            • Price (required, numeric){'\n'}
                            • Category (required){'\n'}
                            • Is General (true/false){'\n'}
                            • Image URL (optional)
                        </Text>
                    </View>
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    uploadModeContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    modeButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    activeModeButton: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    modeButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    activeModeButtonText: {
        color: '#fff',
    },
    form: {
        padding: 20,
    },
    bulkUploadContainer: {
        padding: 20,
    },
    bulkUploadTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 12,
    },
    bulkUploadDescription: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        lineHeight: 22,
    },
    templateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    templateButtonText: {
        fontSize: 16,
        color: '#007AFF',
        marginLeft: 12,
    },
    fileUploadSection: {
        marginBottom: 20,
    },
    filePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 12,
    },
    filePickerText: {
        fontSize: 16,
        color: '#007AFF',
        marginLeft: 12,
    },
    instructionsContainer: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginTop: 20,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    instructionsText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
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
    disabledButton: {
        backgroundColor: '#ccc',
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})

