import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to the Seller Dashboard</Text>
            <View style={styles.buttonContainer}>
                <Button
                    title="Upload Product"
                    onPress={() => navigation.navigate('UploadProduct')}
                />
                <View style={styles.buttonSpacing} />
                <Button
                    title="View Products"
                    onPress={() => navigation.navigate('ProductList')}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    buttonContainer: {
        width: '80%',
    },
    buttonSpacing: {
        height: 10,
    }
});

export default HomeScreen; 