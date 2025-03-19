import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    FlatList,
    Alert
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function LocationPicker({ onLocationSelected }) {
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mapRef, setMapRef] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
            setSelectedLocation({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
            });
        })();
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        try {
            setIsSearching(true);
            const results = await Location.geocodeAsync(searchQuery);

            if (results.length > 0) {
                setSearchResults(results);
                setShowResults(true);
            } else {
                Alert.alert('No Results', 'No locations found for your search.');
            }
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert('Error', 'Failed to search location. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectSearchResult = async (result) => {
        const { latitude, longitude } = result;
        const newLocation = { latitude, longitude };

        setSelectedLocation(newLocation);
        setSearchQuery('');
        setShowResults(false);
        setSearchResults([]);

        // Animate map to new location
        mapRef?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        }, 1000);
    };

    const handleMapPress = (event) => {
        const { coordinate } = event.nativeEvent;
        setSelectedLocation(coordinate);
        setShowResults(false);
    };

    const handleConfirmLocation = async () => {
        if (selectedLocation) {
            try {
                const response = await Location.reverseGeocodeAsync({
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                });

                if (response[0]) {
                    const address = `${response[0].street || ''}, ${response[0].city || ''}, ${response[0].region || ''}`;
                    onLocationSelected({
                        coordinates: [selectedLocation.longitude, selectedLocation.latitude],
                        address: address.replace(/^,\s*/, '').replace(/,\s*,/g, ',')
                    });
                }
            } catch (error) {
                console.error('Error getting address:', error);
                Alert.alert('Error', 'Failed to get address details. Please try again.');
            }
        }
    };

    const renderSearchResult = ({ item }) => (
        <TouchableOpacity
            style={styles.searchResultItem}
            onPress={() => handleSelectSearchResult(item)}
        >
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.searchResultText}>
                {`${item.street || ''}, ${item.city || ''}, ${item.region || ''}`}
            </Text>
        </TouchableOpacity>
    );

    if (errorMsg) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                        setErrorMsg(null);
                        // Retry location permission
                        Location.requestForegroundPermissionsAsync();
                    }}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!location) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for your shop location..."
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            if (text.trim()) {
                                handleSearch();
                            } else {
                                setSearchResults([]);
                                setShowResults(false);
                            }
                        }}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearchQuery('');
                                setSearchResults([]);
                                setShowResults(false);
                            }}
                        >
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
                {isSearching && (
                    <ActivityIndicator
                        style={styles.searchingIndicator}
                        size="small"
                        color="#007AFF"
                    />
                )}
            </View>

            {showResults && searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                    <FlatList
                        data={searchResults}
                        renderItem={renderSearchResult}
                        keyExtractor={(item, index) => index.toString()}
                        style={styles.searchResultsList}
                    />
                </View>
            )}

            <MapView
                ref={(ref) => setMapRef(ref)}
                style={styles.map}
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                onPress={handleMapPress}
            >
                {selectedLocation && (
                    <Marker
                        coordinate={selectedLocation}
                        title="Shop Location"
                        draggable
                        onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
                    />
                )}
            </MapView>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.currentLocationButton]}
                    onPress={() => {
                        if (location) {
                            setSelectedLocation({
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude
                            });
                            mapRef?.animateToRegion({
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }, 1000);
                        }
                    }}
                >
                    <Ionicons name="locate" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Current Location</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.button,
                        styles.confirmButton,
                        !selectedLocation && styles.disabledButton
                    ]}
                    onPress={handleConfirmLocation}
                    disabled={!selectedLocation}
                >
                    <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Confirm Location</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#ff3b30',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    searchContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        zIndex: 1,
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 16,
    },
    searchingIndicator: {
        padding: 8,
    },
    searchResultsContainer: {
        position: 'absolute',
        top: 64,
        left: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 1,
        maxHeight: 200,
    },
    searchResultsList: {
        maxHeight: 200,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchResultText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height - 150,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
    },
    buttonIcon: {
        marginRight: 8,
    },
    currentLocationButton: {
        backgroundColor: '#4CAF50',
    },
    confirmButton: {
        backgroundColor: '#007AFF',
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