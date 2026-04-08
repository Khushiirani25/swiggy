import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, getDocs } from 'firebase/firestore';

const CATEGORIES = [
  { id: '1', name: 'Offers', icon: '🔥' },
  { id: '2', name: 'Pizza', icon: '🍕' },
  { id: '3', name: 'Burger', icon: '🍔' },
  { id: '4', name: 'Healthy', icon: '🥗' }
];

export default function HomeScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'restaurants'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRestaurants(data);
    } catch (e) {
       console.error("Failed to fetch restaurants", e);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.locationRow}>
            <Text style={styles.deliverTo}>Deliver to</Text>
            <Text style={styles.arrowIcon}>▼</Text>
          </View>
          <Text style={styles.address}>123 Main Street, New York...</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{color: '#FF5A5F', fontWeight: 'bold'}}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryItem} activeOpacity={0.7}>
                <View style={styles.categoryIconContainer}>
                  <Text style={styles.categoryIconText}>{cat.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Feed */}
        <View style={styles.feedSection}>
          <Text style={styles.sectionTitle}>{restaurants.length} restaurants around you</Text>
          
          <View style={styles.restaurantList}>
            {loading ? (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
            ) : restaurants.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>No restaurants found.</Text>
            ) : (
              restaurants.map((rest) => (
                <TouchableOpacity 
                  key={rest.id} 
                  style={styles.restaurantCard} 
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Menu', { restaurant: rest })}
                >
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: rest.banner_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349' }} style={styles.restaurantImage} />
                  </View>
                  
                  <View style={styles.restaurantDetails}>
                    <View style={styles.restaurantHeaderRow}>
                      <Text style={styles.restaurantName}>{rest.name}</Text>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ New</Text>
                      </View>
                    </View>
                    <View style={styles.restaurantMetaRow}>
                      <Text style={styles.restaurantTags}>📍 {rest.address}</Text>
                      <Text style={styles.bulletPoint}> • </Text>
                      <Text style={styles.restaurantTime}>🕒 {rest.prep_time_mins || 20} min</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFC', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  scrollContent: { paddingBottom: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  deliverTo: { fontSize: 14, fontWeight: '800', color: '#FF5A5F', marginRight: 4 },
  arrowIcon: { fontSize: 10, color: '#FF5A5F' },
  address: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  profileImg: { width: 42, height: 42, borderRadius: 21 },
  categoriesSection: { paddingVertical: 15, backgroundColor: '#ffffff', marginBottom: 10 },
  categoriesScroll: { paddingHorizontal: 15 },
  categoryItem: { alignItems: 'center', marginHorizontal: 10, width: 70 },
  categoryIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF0F1', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryIconText: { fontSize: 32 },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  feedSection: { paddingHorizontal: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 15 },
  restaurantList: { gap: 20 },
  restaurantCard: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', elevation: 2, marginBottom: 5 },
  imageContainer: { position: 'relative', height: 180, width: '100%' },
  restaurantImage: { width: '100%', height: '100%' },
  restaurantDetails: { padding: 16 },
  restaurantHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  restaurantName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  ratingBadge: { backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  ratingText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  restaurantMetaRow: { flexDirection: 'row', alignItems: 'center' },
  restaurantTags: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  bulletPoint: { fontSize: 14, color: '#D1D5DB' },
  restaurantTime: { fontSize: 14, color: '#6B7280', fontWeight: '600' }
});
