import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useCart } from '../../CartContext';

export default function MenuScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cartItems, addToCart, removeFromCart, subtotal, activeRestaurant } = useCart();

  useEffect(() => {
    fetchMenu();
  }, [restaurant]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const menuRef = collection(db, 'restaurants', restaurant.id, 'menu_items');
      const q = query(menuRef, where('in_stock', '==', true));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMenuItems(data);
    } catch (e) {
      console.error("Failed to fetch menu", e);
    }
    setLoading(false);
  };

  const getQuantity = (itemId) => {
    const item = cartItems.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.restaurantNameHeader}>{restaurant.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <Image source={{ uri: restaurant.banner_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349' }} style={styles.banner} />
        
        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.metaText}>⭐ 4.8  •  🕒 {restaurant.prep_time_mins} mins</Text>
          <Text style={styles.addressText}>{restaurant.address}</Text>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Recommended</Text>
          
          {loading ? (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
          ) : menuItems.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No items available.</Text>
          ) : (
            menuItems.map(item => (
              <View key={item.id} style={styles.menuItem}>
                <View style={styles.itemDetails}>
                  <View style={styles.itemTypeIcon}>
                    <View style={[styles.vegDot, { backgroundColor: item.is_vegetarian ? '#10B981' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)}</Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                </View>
                
                <View style={styles.itemActions}>
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                  <View style={styles.addBtnContainer}>
                    {getQuantity(item.id) > 0 ? (
                      <View style={styles.quantityControl}>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.qtyBtn}>
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{getQuantity(item.id)}</Text>
                        <TouchableOpacity onPress={() => addToCart(item, restaurant)} style={styles.qtyBtn}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => addToCart(item, restaurant)} style={styles.addBtn}>
                        <Text style={styles.addBtnText}>ADD</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating View Cart Button */}
      {cartItems.length > 0 && activeRestaurant?.id === restaurant.id && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Checkout')} style={styles.viewCartBtn} activeOpacity={0.9}>
            <View style={styles.cartInfo}>
              <Text style={styles.itemCountText}>{cartItems.reduce((acc, i) => acc + i.quantity, 0)} items</Text>
              <Text style={styles.subtotalText}>|  ${subtotal.toFixed(2)}</Text>
            </View>
            <Text style={styles.viewCartText}>View Cart ➔</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Keeping identical styles as before to maintain aesthetic
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20 },
  backIcon: { fontSize: 20, color: '#374151', fontWeight: 'bold' },
  restaurantNameHeader: { fontSize: 16, fontWeight: '700', color: '#111827' },
  scrollContent: { paddingBottom: 100 },
  banner: { width: '100%', height: 200 },
  infoSection: { padding: 20, borderBottomWidth: 8, borderBottomColor: '#F9FAFB' },
  restaurantName: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 5 },
  metaText: { fontSize: 14, color: '#4B5563', fontWeight: '600', marginBottom: 5 },
  addressText: { fontSize: 13, color: '#9CA3AF' },
  menuSection: { padding: 20 },
  menuTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 20 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 20 },
  itemDetails: { flex: 1, paddingRight: 15 },
  itemTypeIcon: { width: 14, height: 14, borderWidth: 1, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  itemPrice: { fontSize: 15, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  itemDesc: { fontSize: 13, color: '#9CA3AF', lineHeight: 18 },
  itemActions: { width: 110, alignItems: 'center' },
  itemImage: { width: 110, height: 110, borderRadius: 12, marginBottom: -15 },
  addBtnContainer: { backgroundColor: '#ffffff', borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden' },
  addBtn: { width: 90, paddingVertical: 8, alignItems: 'center' },
  addBtnText: { color: '#FF5A5F', fontWeight: '800', fontSize: 15 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', width: 90, justifyContent: 'space-between' },
  qtyBtn: { width: 30, paddingVertical: 8, alignItems: 'center' },
  qtyBtnText: { color: '#FF5A5F', fontWeight: '800', fontSize: 16 },
  qtyText: { fontWeight: '700', fontSize: 15, color: '#111827' },
  floatingCartContainer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  viewCartBtn: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5 },
  cartInfo: { flexDirection: 'row', alignItems: 'center' },
  itemCountText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  subtotalText: { color: '#ffffff', fontWeight: '800', fontSize: 16, marginLeft: 5 },
  viewCartText: { color: '#ffffff', fontWeight: '800', fontSize: 16 }
});
