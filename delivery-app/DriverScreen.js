import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image } from 'react-native';
import { auth, db } from './firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import MapView, { UrlTile } from './MapStub';

export default function DriverScreen() {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'ready'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Need to fetch restaurant names manually since NoSQL doesn't JOIN like Supabase did
      const ordersWithRest = await Promise.all(snapshot.docs.map(async (d) => {
        const orderData = { id: d.id, ...d.data() };
        let restData = { name: 'Unknown', address: 'Unknown' };
        if (orderData.restaurantOwnerId) {
          try {
             // Safely fetch restaurant info
             const rDoc = await getDoc(doc(db, 'restaurants', orderData.restaurantOwnerId));
             if (rDoc.exists()) restData = rDoc.data();
          } catch (e) {
             console.error(e);
          }
        }
        return { ...orderData, restaurants: restData };
      }));
      setAvailableOrders(ordersWithRest);
    });

    return () => unsubscribe();
  }, []);

  const acceptDelivery = async (order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { 
        status: 'picked_up',
        driverId: auth.currentUser.uid
      });
      setActiveDelivery(order);
    } catch (e) {
      alert("Error accepting delivery: " + e.message);
    }
  };

  const markDelivered = async () => {
    try {
      await updateDoc(doc(db, 'orders', activeDelivery.id), { status: 'delivered' });
      setActiveDelivery(null);
      alert("Delivery recorded successfully!");
    } catch (e) {
      alert("Error completing delivery: " + e.message);
    }
  };

  const handleLogout = async () => await signOut(auth);

  // NO ACTIVE DELIVERY
  if (!activeDelivery) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery Bounty Board</Text>
          <TouchableOpacity onPress={handleLogout}><Text style={{color: '#FF5A5F', fontWeight: 'bold'}}>Log Out</Text></TouchableOpacity>
        </View>

        <View style={styles.boardContainer}>
          {availableOrders.length === 0 ? (
             <View style={styles.emptyState}>
               <Text style={styles.emptyText}>Waiting for restaurants to mark orders ready...</Text>
             </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {availableOrders.map(order => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.cardHeader}>
                     <Text style={styles.earnAmount}>Earn ${(order.delivery_fee * 1.5).toFixed(2)}</Text>
                     <Text style={styles.estPill}>{order.payment_method}</Text>
                  </View>
                  <View style={styles.routeContainer}>
                    <View style={styles.nodeIcon} />
                    <Text style={styles.locationText} numberOfLines={1}>{order.restaurants?.name} ({order.restaurants?.address})</Text>
                  </View>
                  <View style={styles.routeContainer}>
                    <View style={[styles.nodeIcon, { backgroundColor: '#FF5A5F' }]} />
                    <Text style={styles.locationText} numberOfLines={1}>{order.delivery_address}</Text>
                  </View>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptDelivery(order)}>
                    <Text style={styles.acceptBtnText}>Claim Delivery</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ACTIVE DELIVERY
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView 
          style={styles.map} 
          initialRegion={{
            latitude: 40.7588,
            longitude: -73.9851,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <UrlTile 
            urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
        </MapView>
        <View style={styles.mapOverlay}><Text style={styles.mapPill}>📍 Navigating to Customer...</Text></View>
      </View>
      
      <View style={styles.deliveryPanel}>
        <View style={styles.dragHandle} />
        <Text style={styles.panelTitle}>Current Delivery</Text>
        
        <View style={styles.detailsBox}>
          <Text style={styles.detailLabel}>Drop off at:</Text>
          <Text style={styles.detailValue}>{activeDelivery.delivery_address}</Text>
        </View>
        <View style={styles.detailsBox}>
          <Text style={styles.detailLabel}>Restaurant:</Text>
          <Text style={styles.detailValue}>{activeDelivery.restaurants?.name}</Text>
        </View>

        <TouchableOpacity style={styles.deliveredBtn} onPress={markDelivered}>
          <Text style={styles.deliveredBtnText}>{activeDelivery.payment_method === 'COD' ? 'Receive Cash & Mark Delivered' : 'Mark Delivered'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F121A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1A1D24' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  boardContainer: { flex: 1, padding: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#4B5563', fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  orderCard: { backgroundColor: '#1A1D24', borderRadius: 12, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  earnAmount: { fontSize: 20, fontWeight: '800', color: '#10B981' },
  estPill: { backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, color: '#A0AEC0', fontWeight: '800' },
  routeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  nodeIcon: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6', marginRight: 12 },
  locationText: { color: '#E2E8F0', fontSize: 15, fontWeight: '500', flexShrink: 1 },
  acceptBtn: { backgroundColor: '#FF5A5F', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  acceptBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  mapContainer: { flex: 2, position: 'relative' },
  map: { flex: 1 },
  mapOverlay: { position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center' },
  mapPill: { backgroundColor: '#111827', color: '#ffffff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, fontSize: 16, fontWeight: '800', overflow: 'hidden' },
  deliveryPanel: { flex: 1, backgroundColor: '#1A1D24', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#4B5563', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  panelTitle: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginBottom: 20 },
  detailsBox: { backgroundColor: '#242830', padding: 15, borderRadius: 8, marginBottom: 12 },
  detailLabel: { color: '#A0AEC0', fontSize: 13, marginBottom: 4 },
  detailValue: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  deliveredBtn: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 'auto' },
  deliveredBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '800' }
});
