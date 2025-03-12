import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
    items: [],
    loading: false,
    error: null
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const existingItem = state.items.find(item => item._id === action.payload._id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({ ...action.payload, quantity: 1 });
            }
            // Persist to AsyncStorage
            AsyncStorage.setItem('cartItems', JSON.stringify(state.items));
        },
        updateQuantity: (state, action) => {
            const { itemId, change } = action.payload;
            const item = state.items.find(item => item._id === itemId);
            if (item) {
                item.quantity += change;
                if (item.quantity < 1) {
                    state.items = state.items.filter(i => i._id !== itemId);
                }
            }
            AsyncStorage.setItem('cartItems', JSON.stringify(state.items));
        },
        clearCart: (state) => {
            state.items = [];
            AsyncStorage.removeItem('cartItems');
        },
        setCartItems: (state, action) => {
            state.items = action.payload;
        }
    }
});

export const { addToCart, updateQuantity, clearCart, setCartItems } = cartSlice.actions;
export default cartSlice.reducer; 