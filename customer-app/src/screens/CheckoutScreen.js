import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { auth, db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useCart } from '../../CartContext';

export default function CheckoutScreen({ navigation }) {
  const { cartItems, activeRestaurant, subtotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const DELIVERY_FEE = 3.99;
  const TAX_RATE = 0.05;
  
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + DELIVERY_FEE;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Auth Check
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to order.");
      setIsProcessing(false);
      return;
    }
    const customer_id = user.uid;

    const orderPayload = {
      customerId: customer_id,
      restaurantOwnerId: activeRestaurant.id,
      subtotal: subtotal,
      tax_amount: tax,
      delivery_fee: DELIVERY_FEE,
      total_amount: total,
      delivery_address: '123 Main Street, New York',
      status: 'pending',
      payment_method: 'COD',
      created_at: new Date().toISOString(),
      order_items: cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price_tracked: item.price,
        menu_items: { name: item.name }
      }))
    };

    try {
      await addDoc(collection(db, 'orders'), orderPayload);
      alert("Order Placed Successfully via Cash on Delivery!");
      clearCart();
      navigation.navigate('Home');
    } catch (e) {
      console.error(e);
      alert("Failed to create order. " + e.message);
    }
    
    setIsProcessing(false);
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backIcon}>←</Text></TouchableOpacity></View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ordering From</Text>
          <Text style={styles.restaurantName}>{activeRestaurant?.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Items</Text>
          {cartItems.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>${Number(item.price).toFixed(2)}</Text>
              </View>
              <View style={styles.cartItemQty}>
                <Text style={styles.qtyLabel}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.cartItemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* PAYMENT METHOD SELECTOR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentIcon}>💵</Text>
            <View style={{flex: 1}}>
              <Text style={styles.paymentName}>Cash On Delivery (COD)</Text>
              <Text style={styles.paymentDesc}>Pay cash to the delivery executive</Text>
            </View>
            <View style={styles.radioSelected}>
              <View style={styles.radioInner} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>${DELIVERY_FEE.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & Fees</Text>
            <Text style={styles.billValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Footer Checkout Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeOrderBtn, isProcessing && styles.placeOrderBtnDisabled]} 
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.placeOrderText}>Processing...</Text>
          ) : (
            <Text style={styles.placeOrderText}>Confirm COD • ${total.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFC', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20 },
  backIcon: { fontSize: 20, color: '#374151', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollContent: { paddingBottom: 100 },
  section: { backgroundColor: '#ffffff', padding: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 15 },
  restaurantName: { fontSize: 20, fontWeight: '800', color: '#FF5A5F', marginBottom: 4 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cartItemName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cartItemPrice: { fontSize: 13, color: '#6B7280' },
  cartItemQty: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 15 },
  qtyLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  cartItemTotal: { fontSize: 16, fontWeight: '700', color: '#111827', width: 60, textAlign: 'right' },
  paymentBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#10B981', borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
  paymentIcon: { fontSize: 24, marginRight: 15 },
  paymentName: { fontWeight: '700', fontSize: 15, color: '#111827', marginBottom: 2 },
  paymentDesc: { fontSize: 13, color: '#6B7280' },
  radioSelected: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, color: '#4B5563' },
  billValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 15 },
  totalLabel: { fontSize: 18, fontWeight: '800', color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  footer: { padding: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#F3F4F6', position: 'absolute', bottom: 0, left: 0, right: 0 },
  placeOrderBtn: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  placeOrderBtnDisabled: { opacity: 0.7 },
  placeOrderText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, color: '#6B7280', marginBottom: 20 }
});
