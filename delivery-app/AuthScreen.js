import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicle, setVehicle] = useState('Bike');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    if (!email || !password) return alert("Please enter credentials");
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
            role: 'driver',
            email: email,
            approval_status: 'pending',
            vehicle_type: vehicle
          });
          // Initiate driver metadata
          await setDoc(doc(db, 'delivery_partners', user.uid), {
            name: email.split('@')[0],
            is_online: false,
            current_location: null,
            assigned_order: null
          });
        }
        alert("Driver profile created!");
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
        <View style={styles.logoCircle}>
          <Text style={{fontSize: 32}}>🚴</Text>
        </View>
        <Text style={styles.brand}>Delivery Partner</Text>
        <Text style={styles.title}>{isLogin ? 'Driver Login' : 'Become a Driver'}</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Driver Email"
          placeholderTextColor="#A0AEC0"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {!isLogin && (
          <View style={styles.vehicleToggle}>
            {['Bike', 'Scooter', 'Car'].map(v => (
              <TouchableOpacity key={v} onPress={() => setVehicle(v)} style={[styles.vTypeBtn, vehicle === v && styles.vTypeBtnActive]}>
                <Text style={[styles.vTypeText, vehicle === v && {color: '#fff'}]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#A0AEC0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authBtnText}>{isLogin ? 'SECURE LOGIN' : 'CREATE ACCOUNT'}</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 25 }}>
          <Text style={styles.toggleText}>
            {isLogin ? "Want to drive with us? Register Here" : "Already a courier? Log In"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F121A', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', maxWidth: 400, backgroundColor: '#1A1D24', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#FF5A5F', alignItems: 'center' },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 90, 95, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  brand: { fontSize: 24, fontWeight: '900', color: '#ffffff', textAlign: 'center', marginBottom: 5 },
  title: { fontSize: 16, color: '#A0AEC0', textAlign: 'center', marginBottom: 30, fontWeight: '600' },
  input: { width: '100%', backgroundColor: '#242830', color: '#ffffff', borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16 },
  vehicleToggle: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15, backgroundColor: '#242830', borderRadius: 12, padding: 5 },
  vTypeBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  vTypeBtnActive: { backgroundColor: '#FF5A5F' },
  vTypeText: { color: '#A0AEC0', fontWeight: 'bold' },
  authBtn: { width: '100%', backgroundColor: '#FF5A5F', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  authBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  toggleText: { textAlign: 'center', color: '#FF5A5F', fontWeight: '600' }
});
