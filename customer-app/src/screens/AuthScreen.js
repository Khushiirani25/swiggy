import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleGoogleSignIn = async () => {
    if (Platform.OS !== 'web') {
      alert("Google Sign-In natively requires linking the Expo Dev Client. Test this on Web first!");
      return;
    }
    
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Ensure profile exists in DB (swallow permission errors if rules are locked)
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName || user.email.split('@')[0],
            role: 'customer',
            email: user.email,
            auth_provider: 'google'
          });
        }
      } catch(dbErr) {
        console.warn("Firestore profile sync skipped: ", dbErr.message);
      }
      
    } catch (error) {
      // Only alert if the actual Firebase Auth fails
      alert("Google Login Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

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
          try {
            await setDoc(doc(db, 'users', user.uid), {
              name: email.split('@')[0],
              role: 'customer',
              email: email
            });
          } catch(dbErr) {
            console.warn("Firestore profile creation skipped: ", dbErr.message);
          }
        }
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
        <Text style={styles.brand}>QuickBite</Text>
        <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authBtnText}>{isLogin ? 'LOG IN' : 'SIGN UP'}</Text>}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={loading}>
          <Text style={styles.googleBtnText}>🌍 Continue with Google</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 20 }}>
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', maxWidth: 400, backgroundColor: '#ffffff', padding: 30, borderRadius: 16, shadowColor: '#0c0c0c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  brand: { fontSize: 32, fontWeight: '900', color: '#FF5200', textAlign: 'center', marginBottom: 5 },
  title: { fontSize: 16, color: '#686b78', textAlign: 'center', marginBottom: 30, fontWeight: '700' },
  input: { backgroundColor: '#ffffff', borderRadius: 0, borderBottomWidth: 1, borderBottomColor: '#d4d5d9', paddingVertical: 15, paddingHorizontal: 5, marginBottom: 20, fontSize: 16, color: '#02060C', fontWeight: '500' },
  authBtn: { backgroundColor: '#FF5200', paddingVertical: 16, borderRadius: 0, alignItems: 'center', marginTop: 10 },
  authBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e9e9eb' },
  dividerText: { marginHorizontal: 15, color: '#686b78', fontWeight: '800' },
  googleBtn: { backgroundColor: '#ffffff', paddingVertical: 14, borderRadius: 0, alignItems: 'center', borderWidth: 1, borderColor: '#d4d5d9' },
  googleBtnText: { color: '#02060C', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
  toggleText: { textAlign: 'center', color: '#282c3f', fontWeight: '600', fontSize: 14 }
});
