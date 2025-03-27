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
    FlatList,
    Alert,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, BASE_URL } from '../config/api';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        checkAuthAndLocation();
    }, []);

    // Filter products based on search query
    useEffect(() => {
        if (products.length > 0) {
            if (searchQuery.trim() === '') {
                setFilteredProducts(products);
            } else {
                const lowercasedQuery = searchQuery.toLowerCase();
                const filtered = products.filter(product => 
                    product.name.toLowerCase().includes(lowercasedQuery) ||
                    (product.category && product.category.toLowerCase().includes(lowercasedQuery)) ||
                    (product.sellerId?.shopName && product.sellerId.shopName.toLowerCase().includes(lowercasedQuery))
                );
                setFilteredProducts(filtered);
            }
        }
    }, [searchQuery, products]);

    const checkAuthAndLocation = async () => {
        try {
            const userDataString = await AsyncStorage.getItem('userData');
            if (userDataString) {
                const userData = JSON.parse(userDataString);
                setUserData(userData);
                
                // Check if we already have location
                if (!userData.location || !userData.location.coordinates) {
                    await requestAndUpdateLocation();
                } else {
                    // Use existing location to fetch products
                    fetchProducts(userData.location.coordinates[0], userData.location.coordinates[1]);
                }
            } else {
                // Even for non-logged in users, get location for product filtering
                await requestAndUpdateLocation();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            setLoading(false);
        }
    };

    const requestAndUpdateLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Location Permission Required',
                    'We need your location to show nearby medical stores. Please enable location services.',
                    [
                        { text: 'OK', onPress: () => navigation.navigate('Location') }
                    ]
                );
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { longitude, latitude } = location.coords;

            // If user is logged in, update their location in backend and local storage
            if (userData) {
                const response = await fetch(`${API_URL}/buyer/update-location`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userData.token}`
                    },
                    body: JSON.stringify({
                        location: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        }
                    })
                });

                if (response.ok) {
                    // Update local storage
                    const updatedUserData = {
                        ...userData,
                        location: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        }
                    };
                    await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
                    setUserData(updatedUserData);
                }
            }

            // Fetch products based on location
            fetchProducts(longitude, latitude);
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert(
                'Location Error',
                'Unable to get your location. Please set it manually.',
                [
                    { text: 'Set Location', onPress: () => navigation.navigate('Location') }
                ]
            );
            setLoading(false);
        }
    };

    const fetchProducts = async (longitude, latitude) => {
        try {
            const response = await fetch(
                `${API_URL}/buyer/products?longitude=${longitude}&latitude=${latitude}`
            );
            const data = await response.json();
            if (response.ok) {
                setProducts(data);
                setFilteredProducts(data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            Alert.alert('Error', 'Failed to fetch nearby products');
        } finally {
            setLoading(false);
        }
    };

    const handleAddressPress = () => {
        if (userData) {
            navigation.navigate('Location', { returnScreen: 'Home' });
        } else {
            navigation.navigate('Auth', { returnScreen: 'Home' });
        }
    };

    const handleAddToCart = async (product) => {
        const userDataString = await AsyncStorage.getItem('userData');
        if (!userDataString) {
            Alert.alert(
                'Sign in Required',
                'Please sign in to add items to cart',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign In', onPress: () => navigation.navigate('Auth', { returnScreen: 'Home' }) }
                ]
            );
            return;
        }

        dispatch(addToCart(product));
        Alert.alert('Success', 'Item added to cart');
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.profileSection}>
                    <Image
                        source={require('../assets/default-profile.png')}
                        style={styles.profileImage}
                        accessible={true}
                        accessibilityLabel="Profile picture"
                    />
                    <View style={styles.headerRight}>
                        <Text style={styles.welcomeText}>
                            {`Hello, ${userData?.user?.name || 'User'}`}
                        </Text>
                        <TouchableOpacity 
                            style={styles.addressButton}
                            onPress={handleAddressPress}
                        >
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <Text style={styles.addressText} numberOfLines={1}>
                                {userData?.address || 'Set your location'}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <View style={styles.headerButtons}>
                <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => navigation.navigate('Orders')}
                >
                    <Ionicons name="document-text-outline" size={24} color="#007AFF" />
                    <Text style={styles.headerButtonText}>Orders</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <Ionicons name="cart-outline" size={24} color="#007AFF" />
                    {cartItems.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{cartItems.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderProductItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.productCard}
            onPress={async () => {
                // Handle product press if needed
            }}
        >
            <Image 
                source={{ 
                    uri: item.image 
                        ? `${BASE_URL}/${item.image}`
                        : 'https://via.placeholder.com/150'
                }}
                style={styles.productImage}
                accessible={true}
                accessibilityLabel={`Image of ${item.name}`}
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.shopInfoContainer}>
                    <Text style={styles.shopName} numberOfLines={1}>
                        {item.sellerId?.shopName || 'Shop Name'}
                    </Text>
                    {item.distance && (
                        <Text style={styles.distance}>{`${item.distance} km away`}</Text>
                    )}
                </View>
                <Text style={styles.productPrice}>{`₹${item.price}`}</Text>
                {!item.isGeneral && (
                    <Text style={styles.prescriptionRequired}>Prescription Required</Text>
                )}
                <TouchableOpacity 
                    style={styles.addToCartButton}
                    onPress={() => handleAddToCart(item)}
                >
                    <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Finding nearby stores...</Text>
                </View>
            ) : (
                <>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search medicines..."
                            value={searchQuery}
                            onChangeText={handleSearch}
                            onFocus={() => setIsSearching(true)}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={clearSearch}>
                                <Ionicons name="close-circle" size={20} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={filteredProducts}
                        renderItem={renderProductItem}
                        keyExtractor={item => item._id}
                        numColumns={2}
                        columnWrapperStyle={styles.productRow}
                        contentContainerStyle={styles.productList}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={() => (
                            !searchQuery ? (
                                <View style={styles.banner}>
                                    <Image
                                        source={require('../assets/banner.png')}
                                        style={styles.bannerImage}
                                        resizeMode="cover"
                                        accessible={true}
                                        accessibilityLabel="Promotional banner"
                                    />
                                </View>
                            ) : null
                        )}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                {searchQuery ? (
                                    <>
                                        <Text style={styles.emptyText}>No products found</Text>
                                        <Text style={styles.emptySubtext}>Try a different search term</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.emptyText}>No nearby stores found</Text>
                                        <Text style={styles.emptySubtext}>Try changing your location</Text>
                                    </>
                                )}
                            </View>
                        )}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: 50, // Add top margin
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
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
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderRadius: 8,
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        marginHorizontal: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        color: '#333',
        fontSize: 16,
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
        height: 120,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    shopInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    shopName: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        marginRight: 8,
    },
    distance: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 4,
    },
    prescriptionRequired: {
        fontSize: 12,
        color: '#ff3b30',
        marginBottom: 8,
    },
    authButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 15,
    },
    loginButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    registerButton: {
        backgroundColor: '#34C759',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    addToCartButton: {
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 4,
        alignItems: 'center',
    },
    addToCartButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        marginLeft: 16,
        alignItems: 'center',
    },
    headerButtonText: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 4,
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'red',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
    },
});

export default HomeScreen;