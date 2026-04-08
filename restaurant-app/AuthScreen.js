import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    if (!email || !password) return alert("Please enter email and password");
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (user) {
          await setDoc(doc(db, 'users', user.uid), {
            name: email.split('@')[0],
            role: 'vendor',
            email: email,
            approval_status: 'pending',
            address: address || 'Not Provided'
          });
          // Also create a default restaurant profile synced for Admin Registry
          await setDoc(doc(db, 'restaurants', user.uid), {
            ownerId: user.uid,
            name: `${email.split('@')[0]}'s Restaurant`,
            address: address || 'Not Provided',
            banner_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&q=80',
            isOpen: false
          });
        }
        alert("Restaurant Registered successfully!");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>QuickBite Partner</Text>
        <Text style={styles.title}>{isLogin ? 'Vendor Login' : 'Register Restaurant'}</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Contact Email"
          placeholderTextColor="#A0AEC0"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Restaurant Physical Address"
            placeholderTextColor="#A0AEC0"
            value={address}
            onChangeText={setAddress}
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Secure Password"
          placeholderTextColor="#A0AEC0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authBtnText}>{isLogin ? 'ACCESS DASHBOARD' : 'APPLY AS VENDOR'}</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 20 }}>
          <Text style={styles.toggleText}>
            {isLogin ? "New Restaurant? Register Here" : "Already registered? Log In"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F121A', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', maxWidth: 400, backgroundColor: '#1A1D24', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  brand: { fontSize: 28, fontWeight: '900', color: '#10B981', textAlign: 'center', marginBottom: 5 },
  title: { fontSize: 18, color: '#A0AEC0', textAlign: 'center', marginBottom: 30, fontWeight: '600' },
  input: { backgroundColor: '#242830', color: '#ffffff', borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16 },
  authBtn: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  authBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  toggleText: { textAlign: 'center', color: '#10B981', fontWeight: '600' }
});
