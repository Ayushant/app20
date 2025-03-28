import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import secureStorage from '../config/secureStorage';

export default function WelcomeScreen({ navigation }) {
    const handleSkip = async () => {
        try {
            await secureStorage.setItem('skipLogin', 'true');
    navigation.replace('Home');
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome to FairPlace-Med</Text>
                <Text style={styles.subtitle}>Find medicines from nearby stores</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.authButton]}
                    onPress={() => navigation.navigate('Auth')}
                >
                    <Text style={styles.buttonText}>Continue with Phone</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.skipButton]}
                    onPress={handleSkip}
                >
                    <Text style={[styles.buttonText, styles.skipButtonText]}>
                        Skip for now
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        paddingBottom: 20,
    },
    button: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    loginButton: {
        backgroundColor: '#007AFF',
    },
    registerButton: {
        backgroundColor: '#34C759',
    },
    skipButton: {
        backgroundColor: 'transparent',
    },
    buttonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    skipButtonText: {
        color: '#666',
    },
});