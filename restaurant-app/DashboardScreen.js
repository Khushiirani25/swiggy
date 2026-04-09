import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, getDoc, setDoc } from 'firebase/firestore';

const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function DashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    if (!auth.currentUser) return;
    const vendorId = auth.currentUser.uid;
    
    const q = query(
      collection(db, 'orders'),
      where('restaurantOwnerId', '==', vendorId),
      orderBy('created_at', 'desc')
    );

    // [SELF-HEALING] Verify restaurant profile exists for Admin Registry
    const checkProfile = async () => {
      try {
        const restDoc = await getDoc(doc(db, 'restaurants', vendorId));
        if (!restDoc.exists()) {
          console.log("Self-healing: Recreating missing restaurant profile...");
          const userSnap = await getDoc(doc(db, 'users', vendorId));
          const userData = userSnap.exists() ? userSnap.data() : {};
          
          await setDoc(doc(db, 'restaurants', vendorId), {
            ownerId: vendorId,
            name: userData.name ? `${userData.name}'s Restaurant` : "New Restaurant",
            address: userData.address || "Main Street",
            banner_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&q=80',
            isOpen: true
          });
        }
      } catch (e) {
        console.error("Self-healing failed: ", e);
      }
    };
    checkProfile();
    
    // Listen for realtime updates in Firestore
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(liveOrders);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const incomingOrders = orders.filter(o => o.status === 'pending');
  const cookingOrders = orders.filter(o => o.status === 'cooking');
  const readyOrders = orders.filter(o => o.status === 'ready' || o.status === 'picked_up' || o.status === 'delivered');

  const renderOrderCard = (order, actions) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order {order.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.orderTime}>{formatTime(order.created_at)}</Text>
      </View>
      <View style={styles.orderItemsList}>
        {order.order_items && order.order_items.map((item, idx) => (
          <Text key={idx} style={styles.orderItemText}>{item.quantity}x {item.menu_items?.name}</Text>
        ))}
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: ${order.total_amount?.toFixed(2)}</Text>
        <Text style={styles.paymentMethod}>[{order.payment_method}]</Text>
      </View>
      <View style={styles.actionRow}>{actions}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1D24" />
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>👨‍🍳</Text>
          <Text style={styles.headerTitle}>QuickBite Partner Dashboard</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
          <TouchableOpacity style={styles.statusToggle} onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.statusText}>Manage Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}><Text style={{color: '#FF5200'}}>Logout</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.board}>
        <View style={styles.column}>
          <View style={styles.columnHeaderContainer}>
            <Text style={styles.columnHeader}>Incoming ({incomingOrders.length})</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {incomingOrders.map(order => 
              renderOrderCard(order, (
                <TouchableOpacity style={styles.btnAccept} onPress={() => updateOrderStatus(order.id, 'cooking')}>
                  <Text style={styles.btnAcceptText}>ACCEPT & COOK</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.column}>
          <View style={styles.columnHeaderContainer}>
             <Text style={styles.columnHeader}>Cooking ({cookingOrders.length})</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {cookingOrders.map(order => 
              renderOrderCard(order, (
                <TouchableOpacity style={styles.btnReady} onPress={() => updateOrderStatus(order.id, 'ready')}>
                  <Text style={styles.btnReadyText}>MARK READY</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.column}>
           <View style={styles.columnHeaderContainer}>
             <Text style={styles.columnHeader}>Ready for Pickup ({readyOrders.length})</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {readyOrders.map(order => 
              renderOrderCard(order, (
                <View style={styles.btnDisabled}><Text style={styles.btnDisabledText}>{order.status.toUpperCase()}</Text></View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F121A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1D24', paddingHorizontal: 25, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { fontSize: 24, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  statusToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(56, 161, 105, 0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
  statusText: { color: '#10B981', fontWeight: '700', fontSize: 14 },
  board: { flex: 1, flexDirection: Platform.OS === 'web' ? 'row' : 'column', padding: 15, gap: 15 },
  column: { flex: 1, backgroundColor: '#1A1D24', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', minWidth: 320 },
  columnHeaderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  columnHeader: { color: '#A0AEC0', fontSize: 16, fontWeight: '800' },
  orderCard: { backgroundColor: '#242830', borderRadius: 10, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  orderTime: { color: '#A0AEC0', fontSize: 13, fontWeight: '600' },
  orderItemsList: { backgroundColor: '#1A1D24', padding: 12, borderRadius: 8, marginBottom: 12 },
  orderItemText: { color: '#E2E8F0', fontSize: 15, marginBottom: 4, fontWeight: '500' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  orderTotal: { color: '#10B981', fontWeight: '800', fontSize: 16 },
  paymentMethod: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10 },
  btnAccept: { flex: 1, backgroundColor: '#FF5200', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnAcceptText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  btnReady: { flex: 1, backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnReadyText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  btnDisabled: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  btnDisabledText: { color: '#A0AEC0', fontWeight: '800', fontSize: 14 }
});
