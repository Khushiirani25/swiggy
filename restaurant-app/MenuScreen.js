import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Switch, ActivityIndicator, Image } from 'react-native';
import { auth, db } from './firebase';
import { collection, query, onSnapshot, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';

const CATEGORIES = ['Starters', 'Mains', 'Desserts', 'Beverages', 'Quick Bites'];

export default function MenuScreen({ navigation }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Item Form State
  const [showAdd, setShowAdd] = useState(false);
  const [newItemParams, setNewItemParams] = useState({ 
    name: '', price: '', description: '', 
    category: 'Mains', 
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', // Default Sample
    in_stock: true, is_veg: true 
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const itemsRef = collection(db, 'restaurants', auth.currentUser.uid, 'menu_items');
    
    const unsubscribe = onSnapshot(query(itemsRef), (snapshot) => {
      const liveItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMenuItems(liveItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleStock = async (itemId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'restaurants', auth.currentUser.uid, 'menu_items', itemId), {
        in_stock: !currentStatus
      });
    } catch (err) {
      alert("Error updating stock.");
    }
  };

  const removePiece = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'restaurants', auth.currentUser.uid, 'menu_items', itemId));
    } catch (err) {
      alert("Error deleting item.");
    }
  }

  const addItem = async () => {
    if (!newItemParams.name || !newItemParams.price) return alert("Adding Item Failed: Name and Price are required.");
    setAdding(true);
    try {
      const itemsRef = collection(db, 'restaurants', auth.currentUser.uid, 'menu_items');
      await addDoc(itemsRef, {
        name: newItemParams.name,
        price: parseFloat(newItemParams.price),
        description: newItemParams.description,
        category: newItemParams.category,
        image_url: newItemParams.image_url,
        in_stock: newItemParams.in_stock,
        is_veg: newItemParams.is_veg,
        created_at: new Date().toISOString()
      });
      setShowAdd(false);
      setNewItemParams({ 
        name: '', price: '', description: '', category: 'Mains', 
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', 
        in_stock: true, is_veg: true 
      });
    } catch (err) {
      alert("Failed to add piece. " + err.message);
    }
    setAdding(false);
  };

  // Group items by category for the display list!
  const groupedMenu = CATEGORIES.reduce((acc, cat) => {
    const itemsInCat = menuItems.filter(i => i.category === cat);
    if (itemsInCat.length > 0) acc[cat] = itemsInCat;
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 15}}><Text style={{color: '#A0AEC0', fontSize: 24}}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Database</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnText}>{showAdd ? 'CANCEL' : '+ ADD ITEM'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 50}}>
        
        {/* ADD ITEM ADVANCED FORM */}
        {showAdd && (
          <View style={styles.addForm}>
            <Text style={styles.formSectionTitle}>Item Details</Text>
            <TextInput style={styles.input} placeholder="Dish Name (e.g. Garlic Naan)" placeholderTextColor="#6B7280" value={newItemParams.name} onChangeText={t => setNewItemParams({...newItemParams, name: t})} />
            <TextInput style={styles.input} placeholder="Price ($)" placeholderTextColor="#6B7280" keyboardType="numeric" value={newItemParams.price} onChangeText={t => setNewItemParams({...newItemParams, price: t})} />
            <TextInput style={styles.input} placeholder="Detailed Description..." placeholderTextColor="#6B7280" multiline value={newItemParams.description} onChangeText={t => setNewItemParams({...newItemParams, description: t})} />
            
            <Text style={styles.formSectionTitle}>Visual & Categorization</Text>
            <TextInput style={styles.input} placeholder="Image URL (Uses Sample if blank)" placeholderTextColor="#6B7280" value={newItemParams.image_url} onChangeText={t => setNewItemParams({...newItemParams, image_url: t})} />
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                   key={cat} 
                   style={[styles.catPill, newItemParams.category === cat && styles.catPillActive]}
                   onPress={() => setNewItemParams({...newItemParams, category: cat})}
                >
                  <Text style={[styles.catPillText, newItemParams.category === cat && {color:'#fff'}]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.switchRow}>
              <Text style={{color: '#fff', fontSize: 16}}>Dietary: Vegetarian</Text>
              <Switch value={newItemParams.is_veg} onValueChange={v => setNewItemParams({...newItemParams, is_veg: v})} trackColor={{ true: '#10B981', false: '#EF4444' }}/>
            </View>
            
            <TouchableOpacity style={styles.saveBtn} onPress={addItem} disabled={adding}>
              {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>PUBLISH TO MENU</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* SWIGGY CLONE CATEGORIZED MENU DISPLAY */}
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{marginTop: 50}} />
        ) : menuItems.length === 0 && !showAdd ? (
          <View style={styles.emptyBox}><Text style={{color: '#6B7280'}}>Your catalogue is empty.</Text></View>
        ) : (
          <View style={styles.menuContainer}>
            {Object.keys(groupedMenu).map((catName) => (
              <View key={catName} style={styles.categorySection}>
                <Text style={styles.categoryHeading}>{catName} ({groupedMenu[catName].length})</Text>
                
                {groupedMenu[catName].map((item) => (
                  <View key={item.id} style={[styles.itemCard, !item.in_stock && {opacity: 0.6}]}>
                    
                    <View style={styles.itemContentLeft}>
                      <View style={styles.vegIcon}>
                        <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#10B981' : '#EF4444' }]} />
                      </View>
                      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)}</Text>
                      <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                      
                      {/* Control Tray */}
                      <View style={styles.controlTray}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Switch 
                            value={item.in_stock} 
                            onValueChange={() => toggleStock(item.id, item.in_stock)} 
                            trackColor={{ false: '#374151', true: '#10B981' }}
                            style={{transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }]}}
                          />
                          <Text style={{color: item.in_stock ? '#10B981' : '#9CA3AF', fontSize: 12, marginLeft: 5}}>
                            {item.in_stock ? 'In Stock' : 'Sold Out'}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => removePiece(item.id)}><Text style={{color: '#EF4444', fontSize: 12, marginLeft: 15}}>Delete</Text></TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.itemContentRight}>
                       {item.image_url ? (
                         <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                       ) : (
                         <View style={[styles.itemImage, {backgroundColor: '#242830', justifyContent:'center', alignItems:'center'}]}><Text>📸</Text></View>
                       )}
                    </View>

                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F121A' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1D24', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingTop: 50 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '800' },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  addForm: { padding: 20, backgroundColor: '#1A1D24', borderBottomWidth: 1, borderColor: '#374151' },
  formSectionTitle: { color: '#A0AEC0', fontWeight: '700', marginTop: 10, marginBottom: 15, fontSize: 14, textTransform: 'uppercase' },
  input: { backgroundColor: '#242830', color: '#fff', padding: 14, borderRadius: 10, marginBottom: 12 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#242830', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#374151' },
  catPillActive: { backgroundColor: '#FF5A5F', borderColor: '#FF5A5F' },
  catPillText: { color: '#A0AEC0', fontWeight: '600', fontSize: 13 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#242830', padding: 15, borderRadius: 10 },
  saveBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  menuContainer: { padding: 15 },
  categorySection: { marginBottom: 25 },
  categoryHeading: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 15, paddingLeft: 5 },
  itemCard: { flexDirection: 'row', backgroundColor: '#1A1D24', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#2A2E39', elevation: 3 },
  itemContentLeft: { flex: 1, paddingRight: 15 },
  itemContentRight: { width: 110, justifyContent: 'center' },
  itemImage: { width: 110, height: 110, borderRadius: 12 },
  vegIcon: { width: 14, height: 14, borderWidth: 1, borderColor: '#A0AEC0', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  itemPrice: { color: '#A0AEC0', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  itemDesc: { color: '#6B7280', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  controlTray: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#2A2E39', paddingTop: 12 },
  emptyBox: { padding: 50, alignItems: 'center' }
});
