import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Text,
    Alert,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/api';
import secureStorage from '../config/secureStorage';

export default function AuthScreen({ navigation, route }) {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [confirmPhoneNumber, setConfirmPhoneNumber] = useState('');
    const [verificationStep, setVerificationStep] = useState(1); // 1: initial, 2: confirm
    const [isExistingUser, setIsExistingUser] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleVerifyPhone = async () => {
        if (!phoneNumber || phoneNumber.length !== 10) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }

        try {
            setLoading(true);
            const formattedPhone = '+91' + phoneNumber;
            
            const response = await axios.post(`${API_URL}/buyer/verify-phone`, {
                phoneNumber: formattedPhone
            });

            setIsExistingUser(response.data.isExistingUser);
            setVerificationStep(2);
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'Failed to verify phone number. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Update the error handling in handleConfirmPhone
    const handleConfirmPhone = async () => {
        if (phoneNumber !== confirmPhoneNumber) {
            Alert.alert('Error', 'Phone numbers do not match');
            return;
        }
    
        if (!isExistingUser && !name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }
    
        try {
            setLoading(true);
            const formattedPhone = '+91' + phoneNumber;
            
            const response = await axios.post(`${API_URL}/buyer/confirm-phone`, {
                phoneNumber: formattedPhone,
                confirmPhoneNumber: '+91' + confirmPhoneNumber,
                name: !isExistingUser ? name : undefined
            });
    
            await secureStorage.setObject('userData', response.data);
            
            if (route.params?.returnScreen) {
                navigation.replace(route.params.returnScreen, {
                    productId: route.params.productId
                });
            } else {
                navigation.replace('Home');
            }
        } catch (error) {
            console.error('Error:', error.response?.data || error);
            Alert.alert(
                'Error',
                error.response?.data?.error || 'Registration failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.innerContainer}>
                    <Text style={styles.title}>Welcome to FairPlace-Med</Text>
                    
                    {verificationStep === 1 ? (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.prefix}>+91</Text>
                                <TextInput
                                    style={[styles.phoneInput]}
                                    placeholder="Phone Number"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.button, loading && styles.disabledButton]}
                                onPress={handleVerifyPhone}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Continue</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {!isExistingUser && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your Name"
                                    value={name}
                                    onChangeText={setName}
                                />
                            )}
                            <View style={styles.inputContainer}>
                                <Text style={styles.prefix}>+91</Text>
                                <TextInput
                                    style={[styles.phoneInput]}
                                    placeholder="Confirm Phone Number"
                                    value={confirmPhoneNumber}
                                    onChangeText={setConfirmPhoneNumber}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.button, loading && styles.disabledButton]}
                                onPress={handleConfirmPhone}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {isExistingUser ? 'Login' : 'Register'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
        justifyContent: 'center',
    },
    prefix: {
        fontSize: 16,
        marginRight: 10,
    },
    input: {
        width: '80%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    phoneInput: {
        width: '80%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#34C759',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        width: '80%',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});