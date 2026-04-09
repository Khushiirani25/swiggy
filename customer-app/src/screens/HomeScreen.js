import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, SafeAreaView, Platform, StatusBar, Dimensions } from 'react-native';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, getDocs } from 'firebase/firestore';
import { MapPin, ChevronDown, User, Search, Clock, Star, BadgePercent } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isDesktop = width > 768;

const MEGA_CATEGORIES = [
  { id: '1', name: 'Food delivery', sub: 'CRAVING SOMETHING?', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&q=80' },
  { id: '2', name: 'Instamart', sub: 'INSTANT GROCERY', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80' },
  { id: '3', name: 'Dineout', sub: 'EAT OUT & SAVE', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80' },
  { id: '4', name: 'Genie', sub: 'PICK-UP & DROP', image: 'https://images.unsplash.com/photo-1615671524813-05f425f190b4?auto=format&fit=crop&w=200&q=80' }
];

const MINDS = [
  { id: '1', name: 'Biryani', img: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=150&q=80' },
  { id: '2', name: 'Pizzas', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=150&q=80' },
  { id: '3', name: 'Burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&q=80' },
  { id: '4', name: 'North Indian', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=150&q=80' },
  { id: '5', name: 'Cakes', img: 'https://images.unsplash.com/photo-1578985545062-69928b1ea66b?auto=format&fit=crop&w=150&q=80' }
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
      
      {/* SWIGGY HEADER */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <MapPin size={22} color="#FF5200" style={{marginTop: 2}} />
          <View style={styles.locationTextContainer}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.locationTitle}>Home</Text>
              <ChevronDown size={18} color="#02060C" style={{marginLeft: 4, marginTop: 2}} />
            </View>
            <Text style={styles.locationSubtitle} numberOfLines={1}>123 Main Street, New York Hub...</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={handleLogout}>
          <User size={24} color="#02060C" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* SEARCH BAR */}
        <View style={styles.searchSection}>
          <TouchableOpacity style={styles.searchBar}>
            <Text style={styles.searchPlaceholder}>Search for "Biryani"</Text>
            <Search size={20} color="#686b78" />
          </TouchableOpacity>
        </View>

        {/* MEGA MENU (GROCERY / DINEOUT ETC) */}
        <View style={styles.megaMenuContainer}>
          {MEGA_CATEGORIES.map(item => (
            <TouchableOpacity key={item.id} style={styles.megaCard}>
                <Image source={{ uri: item.image }} style={styles.megaImage} />
                <View style={styles.megaOverlay}>
                  <Text style={styles.megaTitle}>{item.name}</Text>
                  <Text style={styles.megaSubtitle}>{item.sub}</Text>
                </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* WHATS ON YOUR MIND SECTION */}
        <View style={styles.mindsSection}>
          <Text style={styles.sectionHeading}>What's on your mind?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {MINDS.map(item => (
              <TouchableOpacity key={item.id} style={styles.mindItem}>
                <Image source={{ uri: item.img }} style={styles.mindImage} />
                <Text style={styles.mindText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* RESTAURANTS FEED */}
        <View style={styles.feedSection}>
          <Text style={styles.sectionHeading}>Restaurants to explore</Text>
          
          <View style={isDesktop ? styles.restaurantGrid : styles.restaurantList}>
            {loading ? (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>Gathering the best places...</Text>
            ) : restaurants.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>No restaurants found.</Text>
            ) : (
              restaurants.map((rest) => (
                <TouchableOpacity 
                  key={rest.id} 
                  style={[styles.restaurantCard, isDesktop && styles.desktopCard]} 
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Menu', { restaurant: rest })}
                >
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: rest.banner_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349' }} style={styles.restaurantImage} />
                    <View style={styles.offerBadge}>
                      <BadgePercent size={14} color="#fff" />
                      <Text style={styles.offerText}>50% OFF</Text>
                    </View>
                  </View>
                  
                  <View style={styles.restaurantDetails}>
                    <Text style={styles.restaurantName} numberOfLines={1}>{rest.name}</Text>
                    
                    <View style={styles.ratingRow}>
                      <View style={styles.starCircle}>
                        <Star size={12} color="#fff" fill="#fff" />
                      </View>
                      <Text style={styles.ratingText}>• 4.5 • {rest.prep_time_mins || 20} mins</Text>
                    </View>

                    <Text style={styles.restaurantTags} numberOfLines={1}>{rest.address}</Text>
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
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  scrollContent: { paddingBottom: 80 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 15, backgroundColor: '#ffffff' },
  locationContainer: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  locationTextContainer: { marginLeft: 8, flex: 1 },
  locationTitle: { fontSize: 18, fontWeight: '800', color: '#02060C' },
  locationSubtitle: { fontSize: 13, color: '#686b78', marginTop: 2, paddingRight: 20 },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f5', justifyContent: 'center', alignItems: 'center' },
  
  searchSection: { paddingHorizontal: 16, marginBottom: 20 },
  searchBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f0f5', borderRadius: 12, paddingHorizontal: 16, height: 48 },
  searchPlaceholder: { color: '#686b78', fontSize: 16, fontWeight: '500' },
  
  megaMenuContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, justifyContent: 'space-between', marginBottom: 25 },
  megaCard: { width: '48%', height: 110, borderRadius: 16, overflow: 'hidden', marginBottom: 12, backgroundColor: '#f0f0f5' },
  megaImage: { width: '100%', height: '100%' },
  megaOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', padding: 12, justifyContent: 'flex-end' },
  megaTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  megaSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  
  mindsSection: { paddingBottom: 25 },
  sectionHeading: { fontSize: 20, fontWeight: '800', color: '#02060C', marginHorizontal: 16, marginBottom: 15 },
  horizontalScroll: { paddingHorizontal: 10 },
  mindItem: { width: 85, alignItems: 'center', marginHorizontal: 6 },
  mindImage: { width: 75, height: 75, borderRadius: 40, marginBottom: 8 },
  mindText: { fontSize: 13, fontWeight: '600', color: '#02060C', textAlign: 'center' },
  
  divider: { height: 8, backgroundColor: '#f0f0f5', marginVertical: 10 },
  
  feedSection: { paddingTop: 20, paddingHorizontal: 16 },
  restaurantList: { gap: 24 },
  restaurantGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24 },
  desktopCard: { width: '31%' },
  restaurantCard: { width: '100%', marginBottom: 10 },
  imageContainer: { position: 'relative', height: 180, width: '100%', borderRadius: 16, overflow: 'hidden' },
  restaurantImage: { width: '100%', height: '100%' },
  offerBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#FF5200', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  offerText: { color: '#fff', fontWeight: '800', fontSize: 12, marginLeft: 4 },
  
  restaurantDetails: { paddingTop: 12, paddingHorizontal: 4 },
  restaurantName: { fontSize: 18, fontWeight: '800', color: '#02060C', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  starCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#1ba672', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#02060C' },
  restaurantTags: { fontSize: 14, color: '#686b78', fontWeight: '500' },
});
