import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './store';
import WelcomeScreen from './screens/WelcomeScreen';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import CartScreen from './screens/CartScreen';
import OrdersScreen from './screens/OrdersScreen';
import LocationScreen from './screens/LocationScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Location" component={LocationScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
