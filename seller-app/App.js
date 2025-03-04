import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen.js';
import RegisterScreen from './screens/RegisterScreen.js';
import LoginScreen from './screens/LoginScreen.js';
import UploadProductScreen from './screens/UploadProductScreen.js';
import ProductListScreen from './screens/ProductListScreen.js';
import AddEditProductScreen from './screens/AddEditProductScreen.js';
import OrdersScreen from './screens/OrdersScreen.js';
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="UploadProduct" component={UploadProductScreen} />
        <Stack.Screen name="ProductList" component={ProductListScreen} />
        <Stack.Screen
          name="AddEditProduct"
          component={AddEditProductScreen}
          options={({ route }) => ({
            title: route.params?.product ? 'Edit Product' : 'Add Product'
          })}
        />
        <Stack.Screen name="OrderList" component={OrdersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
