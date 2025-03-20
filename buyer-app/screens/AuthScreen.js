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
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';

export default function AuthScreen({ navigation, route }) {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isExistingUser, setIsExistingUser] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!phoneNumber || phoneNumber.length !== 10) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }

        try {
            setLoading(true);
            const formattedPhone = '+91' + phoneNumber;
            console.log('Sending OTP to:', formattedPhone);
            
            const response = await axios.post(`${API_URL}/buyer/send-otp`, {
                phoneNumber: formattedPhone
            });

            console.log('OTP Response:', response.data);

            setIsExistingUser(response.data.isExistingUser);
            
            // Move name validation here before setting otpSent
            // if (!response.data.isExistingUser) {
            //     if (!name.trim()) {
            //         Alert.alert('Error', 'Please enter your name to register');
            //         setLoading(false);
            //         return;
            //     }
            // }

            setOtpSent(true);
            Alert.alert('Success', 'OTP sent successfully');
        } catch (error) {
            console.error('Error sending OTP:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid OTP');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`${API_URL}/buyer/verify-otp`, {
                phoneNumber: '+91' + phoneNumber,
                otp,
                name: !isExistingUser ? name : undefined
            });

            await AsyncStorage.setItem('userData', JSON.stringify(response.data));
            if (route.params?.returnScreen) {
                navigation.replace(route.params.returnScreen, {
                    productId: route.params.productId
                });
            } else {
                navigation.replace('Home');
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', isExistingUser ? 'Invalid OTP' : 'Registration failed');
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
                    {!otpSent ? (
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
                                onPress={handleSendOTP}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Send OTP</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {!isExistingUser && (
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Full Name"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            )}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="numeric"
                                    maxLength={6}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.button, loading && styles.disabledButton]}
                                onPress={() => {
                                    if (!isExistingUser && !name.trim()) {
                                        Alert.alert('Error', 'Please enter your name to register');
                                        return;
                                    }
                                    Keyboard.dismiss();
                                    handleVerifyOTP();
                                }}
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