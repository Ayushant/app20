import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Dimensions,
    FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://172.31.41.234:8000/api';
const BASE_URL = 'http://172.31.41.234:8000';
const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        checkAuthStatus();
        fetchProducts();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const userDataString = await AsyncStorage.getItem('userData');
            if (userDataString) {
                const userData = JSON.parse(userDataString);
                setUserData(userData);
                fetchUserAddresses(userData.token);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    };

    const fetchUserAddresses = async (token) => {
        try {
            const response = await fetch(`${API_URL}/buyer/addresses`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setAddresses(data.addresses);
                setSelectedAddress(data.addresses[0]); // Set first address as default
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/buyer/products`);
            const data = await response.json();
            if (response.ok) {
                setProducts(data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleAddressPress = () => {
        if (userData) {
            navigation.navigate('AddressManagement');
        } else {
            navigation.navigate('Login', { returnScreen: 'Home' });
        }
    };

    const handleProfilePress = () => {
        if (userData) {
            navigation.navigate('Profile');
        } else {
            navigation.navigate('Login', { returnScreen: 'Home' });
        }
    };

    const renderProductItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.productCard}
            onPress={async () => {
                const userDataString = await AsyncStorage.getItem('userData');
                if (!userDataString) {
                    navigation.navigate('Login', { 
                        returnScreen: 'ProductDetails',
                        productId: item._id 
                    });
                } else {
                    navigation.navigate('ProductDetails', { productId: item._id });
                }
            }}
        >
            <Image 
                source={{ 
                    uri: item.image 
                        ? `${BASE_URL}/${item.image}`
                        : 'https://via.placeholder.com/150'
                }}
                style={styles.productImage}
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.shopName} numberOfLines={1}>
                    {item.sellerId?.shopName || 'Shop Name'}
                </Text>
                <Text style={styles.productPrice}>₹{item.price}</Text>
                {!item.isGeneral && (
                    <Text style={styles.prescriptionRequired}>Prescription Required</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleProfilePress} style={styles.profileSection}>
                    <Image
                        source={userData?.profileImage 
                            ? { uri: userData.profileImage }
                            : require('../assets/default-profile.png')}
                        style={styles.profileImage}
                    />
                    <View style={styles.headerRight}>
                        <Text style={styles.welcomeText}>
                            {userData ? `Hello, ${userData.name}` : 'Welcome Guest'}
                        </Text>
                        <TouchableOpacity onPress={handleAddressPress} style={styles.addressButton}>
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <Text style={styles.addressText} numberOfLines={1}>
                                {selectedAddress?.address || 'Add Address'}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <TouchableOpacity 
                style={styles.searchBar}
                onPress={() => navigation.navigate('Search')}
            >
                <Ionicons name="search" size={20} color="#666" />
                <Text style={styles.searchPlaceholder}>Search medicines...</Text>
            </TouchableOpacity>

            {/* Products List */}
            <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={item => item._id}
                numColumns={2}
                columnWrapperStyle={styles.productRow}
                contentContainerStyle={styles.productList}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={styles.banner}>
                        <Image
                            source={require('../assets/banner.png')}
                            style={styles.bannerImage}
                            resizeMode="cover"
                        />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    headerRight: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    addressButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        marginHorizontal: 4,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    searchPlaceholder: {
        marginLeft: 8,
        color: '#666',
        fontSize: 16,
    },
    banner: {
        width: width - 32,
        height: 150,
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 8,
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    productList: {
        paddingBottom: 20,
    },
    productRow: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    productCard: {
        width: (width - 40) / 2,
        marginBottom: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productImage: {
        width: '100%',
        height: 150,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    shopName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    prescriptionRequired: {
        fontSize: 12,
        color: '#ff6b6b',
        marginTop: 4,
    },
});

export default HomeScreen; 