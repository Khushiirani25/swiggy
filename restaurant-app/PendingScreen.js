import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { auth } from './firebase';

export default function PendingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={{fontSize: 48, marginBottom: 20}}>⏳</Text>
        <Text style={styles.title}>Application Pending</Text>
        <Text style={styles.desc}>Your restaurant has been submitted to the QuickBite Citadel. Our admins are currently reviewing your menu and details. Please check back later.</Text>
        
        <TouchableOpacity style={styles.btn} onPress={() => auth.signOut()}>
          <Text style={styles.btnText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F121A', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', backgroundColor: '#1A1D24', padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 15 },
  desc: { color: '#A0AEC0', textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 30 },
  btn: { backgroundColor: '#374151', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
