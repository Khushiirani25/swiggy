import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import AuthScreen from './AuthScreen';
import DriverScreen from './DriverScreen';
import PendingScreen from './PendingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let status = 'pending';
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            status = docSnap.data().approval_status || 'approved'; // Default to approved for legacy compatibility
          }
        } catch (e) {
          console.error("Failed to fetch approval status", e);
        }
        setSession({ user, status });
      } else {
        setSession(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          session.status === 'pending' ? (
            <Stack.Screen name="Pending" component={PendingScreen} />
          ) : (
            <Stack.Screen name="Driver" component={DriverScreen} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
