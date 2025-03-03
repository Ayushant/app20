import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function LocationPicker({ onLocationSelected }) {
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mapRef, setMapRef] = useState(null);

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
        if (!searchQuery.trim()) return;

        try {
            setIsSearching(true);
            const results = await Location.geocodeAsync(searchQuery);

            if (results.length > 0) {
                const { latitude, longitude } = results[0];
                const newLocation = {
                    latitude,
                    longitude
                };

                setSelectedLocation(newLocation);

                // Animate map to new location
                mapRef?.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }, 1000);
            } else {
                alert('Location not found');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Error searching location');
        } finally {
            setIsSearching(false);
        }
    };

    const handleMapPress = (event) => {
        const { coordinate } = event.nativeEvent;
        setSelectedLocation(coordinate);
    };

    const handleConfirmLocation = async () => {
        if (selectedLocation) {
            try {
                // Get address from coordinates (reverse geocoding)
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
                alert('Error getting address details');
            }
        }
    };

    if (errorMsg) {
        return <Text style={styles.errorText}>{errorMsg}</Text>;
    }

    if (!location) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Loading map...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search location..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                {isSearching && (
                    <ActivityIndicator
                        style={styles.searchingIndicator}
                        size="small"
                        color="#0000ff"
                    />
                )}
            </View>

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
                    <Text style={styles.buttonText}>
                        Confirm Location
                    </Text>
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        height: 40,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    searchingIndicator: {
        marginRight: 10,
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
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    currentLocationButton: {
        backgroundColor: '#4CAF50',
    },
    confirmButton: {
        backgroundColor: '#007AFF',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
}); 