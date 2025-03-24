import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import secureStorage from '../config/secureStorage';

export default function HomeScreen({ navigation }) {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Use useFocusEffect to refresh data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchDashboardData();
        }, [])
    );

    const fetchDashboardData = async () => {
        try {
            const sellerData = await secureStorage.getObject('sellerData');
            if (!sellerData) {
                Alert.alert('Session Expired', 'Your session has expired. Please login again.');
                navigation.replace('Login');
                return;
            }

            if (!sellerData.token) {
                Alert.alert('Authentication Error', 'Authentication token not found. Please login again.');
                navigation.replace('Login');
                return;
            }

            const response = await fetch(`${API_URL}/seller/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${sellerData.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                Alert.alert('Session Expired', 'Your session has expired. Please login again.');
                await secureStorage.removeItem('sellerData');
                navigation.replace('Login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Failed to fetch dashboard data');
            }

            const data = await response.json();
            setDashboardData(data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            
            // More specific error handling based on error type
            let errorMessage = 'An unexpected error occurred. Please try again.';
            
            if (error.message.includes('Network request failed')) {
                errorMessage = 'Network connection error. Please check your internet connection.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Alert.alert(
                'Dashboard Error',
                errorMessage,
                [
                    {
                        text: 'Retry',
                        onPress: () => {
                            setRefreshing(true);
                            fetchDashboardData();
                        }
                    },
                    {
                        text: 'Logout',
                        onPress: async () => {
                            await secureStorage.removeItem('sellerData');
                            navigation.replace('Login');
                        }
                    }
                ]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleOrderAction = async (orderId, action) => {
        try {
            setLoading(true);
            const sellerData = await secureStorage.getObject('sellerData');
            if (!sellerData) {
                Alert.alert('Session Expired', 'Your session has expired. Please login again.');
                navigation.replace('Login');
                return;
            }
            
            if (!sellerData.token) {
                Alert.alert('Authentication Error', 'Authentication token not found. Please login again.');
                navigation.replace('Login');
                return;
            }

            const response = await fetch(`${API_URL}/seller/order/${orderId}/${action}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${sellerData.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                Alert.alert('Session Expired', 'Your session has expired. Please login again.');
                await secureStorage.removeItem('sellerData');
                navigation.replace('Login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Failed to ${action} order`);
            }

            // Refresh dashboard data
            fetchDashboardData();
            
            Alert.alert(
                'Success',
                `Order ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error(`Error ${action}ing order:`, error);
            
            // Provide more specific error messages
            let errorMessage = `Failed to ${action} order. Please try again.`;
            
            if (error.message.includes('Network request failed')) {
                errorMessage = 'Network connection error. Please check your internet connection.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Alert.alert(
                `${action.charAt(0).toUpperCase() + action.slice(1)} Error`,
                errorMessage,
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.profileSection}>
                    <Ionicons name="person-circle-outline" size={50} color="#007AFF" />
                    <View style={styles.profileInfo}>
                        <Text style={styles.sellerName}>{dashboardData?.seller?.name || 'Seller Name'}</Text>
                        <Text style={styles.shopName}>{dashboardData?.seller?.shopName || 'Shop Name'}</Text>
                    </View>
                </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <TouchableOpacity 
                    style={styles.statCard}
                    onPress={() => navigation.navigate('OrderList')}
                >
                    <View style={[styles.statIcon, { backgroundColor: '#FFE5E5' }]}>
                        <Ionicons name="time-outline" size={24} color="#FF3B30" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statValue}>{dashboardData?.dashboard?.pendingOrders || 0}</Text>
                        <Text style={styles.statLabel}>Pending Orders</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.statCard}
                    onPress={() => navigation.navigate('OrderList')}
                >
                    <View style={[styles.statIcon, { backgroundColor: '#E5F6FF' }]}>
                        <Ionicons name="wallet-outline" size={24} color="#007AFF" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statValue}>₹{dashboardData?.dashboard?.totalEarnings || 0}</Text>
                        <Text style={styles.statLabel}>Total Earnings</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('UploadProduct')}
                    >
                        <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                        <Text style={styles.actionButtonText}>Add Product</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('ProductList')}
                    >
                        <Ionicons name="list-outline" size={24} color="#007AFF" />
                        <Text style={styles.actionButtonText}>Products</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('OrderList')}
                    >
                        <Ionicons name="receipt-outline" size={24} color="#007AFF" />
                        <Text style={styles.actionButtonText}>Orders</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Today's Orders */}
            <View style={styles.todayOrders}>
                <Text style={styles.sectionTitle}>Today's Orders</Text>
                {dashboardData?.dashboard?.todayOrders?.length > 0 ? (
                    dashboardData.dashboard.todayOrders.map((order) => (
                        <View key={order._id} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderId}>Order #{order._id.slice(-6)}</Text>
                                <Text style={styles.orderAmount}>₹{order.totalPrice}</Text>
                            </View>
                            <Text style={styles.orderCustomer}>
                                Customer: {order.buyerId?.name || 'Unknown'}
                            </Text>
                            <View style={styles.orderActions}>
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.acceptButton]}
                                    onPress={() => handleOrderAction(order._id, 'accept')}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
                                    <Text style={[styles.actionButtonText, styles.acceptButtonText]}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => handleOrderAction(order._id, 'reject')}
                                >
                                    <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
                                    <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noOrders}>No pending orders for today</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
    header: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileInfo: {
        marginLeft: 15,
    },
    sellerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    shopName: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 15,
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 5,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statInfo: {
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    quickActions: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 5,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        marginTop: 8,
        fontSize: 14,
        color: '#333',
    },
    todayOrders: {
        padding: 15,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    orderAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    orderCustomer: {
        fontSize: 14,
        color: '#666',
    },
    noOrders: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        marginTop: 20,
    },
    orderActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        gap: 10,
    },
    acceptButton: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rejectButton: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    acceptButtonText: {
        color: '#34C759',
        fontSize: 14,
        fontWeight: '600',
    },
    rejectButtonText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '600',
    },
});



