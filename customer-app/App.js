import React, { useState, useEffect } from 'react';
import { CartProvider } from './CartContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Home, ShoppingBag, Store, CreditCard, User } from 'lucide-react-native';

import HomeScreen from './src/screens/HomeScreen';
import MenuScreen from './src/screens/MenuScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import AuthScreen from './src/screens/AuthScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF5200',
        tabBarInactiveTintColor: '#686b78',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e9e9eb',
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tab.Screen 
        name="Swiggy" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color }) => <Home size={24} color={color} /> }} 
      />
      <Tab.Screen 
        name="Food" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} /> }} 
      />
      <Tab.Screen 
        name="Instamart" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color }) => <Store size={24} color={color} /> }} 
      />
      <Tab.Screen 
        name="Dineout" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color }) => <CreditCard size={24} color={color} /> }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setSession({ user });
      } else {
        setSession(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <CartProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session && session.user ? (
            <>
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              <Stack.Screen name="Menu" component={MenuScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}
