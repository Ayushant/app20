import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Text,
    Alert,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function LoginScreen({ navigation, route }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('http://172.31.110.208:8000/api/buyer/send-otp', {
                phoneNumber: '+91' + phoneNumber
            });

            if (!response.data.isExistingUser) {
                Alert.alert(
                    'Account not found',
                    'Would you like to register?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Register', onPress: () => navigation.replace('Register') }
                    ]
                );
                return;
            }

            setOtpSent(true);
            Alert.alert('Success', 'OTP sent successfully');
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'Failed to send OTP');
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
            const response = await axios.post('http://172.31.41.234:8000/api/buyer/verify-otp', {
                phoneNumber: '+91' + phoneNumber,
                otp
            });

            await AsyncStorage.setItem('userData', JSON.stringify(response.data));
            handleSuccessfulLogin();
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessfulLogin = () => {
        if (route.params?.returnScreen) {
            navigation.replace(route.params.returnScreen, {
                productId: route.params.productId
            });
        } else {
            navigation.replace('Home');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            {!otpSent ? (
                <>
                    <View style={styles.inputContainer}>
                        <Text style={styles.prefix}>+91</Text>
                        <TextInput
                            style={styles.input}
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
                    <TextInput
                        style={styles.input}
                        placeholder="Enter OTP"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                    />
                    <TouchableOpacity
                        style={[styles.button, loading && styles.disabledButton]}
                        onPress={handleVerifyOTP}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Verify OTP</Text>
                        )}
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity
                style={styles.switchButton}
                onPress={() => navigation.replace('Register')}
            >
                <Text style={styles.switchButtonText}>
                    Don't have an account? Register
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        marginTop: 50,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    prefix: {
        fontSize: 16,
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
}); 