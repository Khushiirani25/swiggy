import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Store, Users, Settings, Bike, Plus, ShieldCheck, Mail, Ban, Trash2, Eye, Map, List, Package } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, addDoc, getDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [restaurants, setRestaurants] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRest, setNewRest] = useState({ name: '', address: '', image_url: '', prep_time_mins: 15 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) console.log("Current Admin Authenticated as:", user.email);
      validateAdminSession(user);
    });
    return () => unsubscribe();
  }, []);

  const validateAdminSession = async (userPayload) => {
    if (userPayload && userPayload.email !== 'admin@quickbite.com') {
      await signOut(auth);
      alert("UNAUTHORIZED ACCESS. Only SuperAdmins may access this portal.");
      setSession(null);
    } else {
      setSession(userPayload);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    
    if (email !== 'admin@quickbite.com') {
      alert("UNAUTHORIZED ACCESS. Only SuperAdmins may access this portal.");
      setAuthLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      // If the admin account doesn't exist yet, securely auto-initialize it
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          alert("Admin Citadel Securely Initialized to Backend!");
        } catch (initErr) {
          alert("Initialization Error: " + initErr.message);
        }
      } else {
        alert(error.message);
      }
    }
    setAuthLoading(false);
  };

  useEffect(() => {
    if (session) {
      if (activeTab === 'overview') {
        fetchStats();
      }
      if (activeTab === 'restaurants') fetchRestaurants();
      if (activeTab === 'approvals') fetchPendingApprovals();
      if (activeTab === 'users') fetchAllUsers();
      
      // Real-time listener for Logistics
      if (activeTab === 'logistics') {
        const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setActiveOrders(data);
        });
        return () => unsubscribe();
      }
    }
  }, [activeTab, session]);

  const [stats, setStats] = useState({ users: 0, restaurants: 0, orders: 0, revenue: 0 });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const uSnap = await getDocs(collection(db, 'users'));
      const rSnap = await getDocs(collection(db, 'restaurants'));
      const oSnap = await getDocs(collection(db, 'orders'));
      
      let totalRev = 0;
      oSnap.docs.forEach(d => {
        totalRev += (d.data().total_price || 0);
      });

      setStats({
        users: uSnap.size,
        restaurants: rSnap.size,
        orders: oSnap.size,
        revenue: totalRev
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      setAllUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'restaurants'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRestaurants(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('approval_status', '==', 'pending'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPendingUsers(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleApprove = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), { approval_status: 'approved' });
      fetchPendingApprovals();
      alert("User Approved and Unlocked!");
    } catch (e) {
      alert("Error approving user. " + e.message);
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        approval_status: isBlocked ? 'approved' : 'blocked' 
      });
      fetchAllUsers();
      alert(isBlocked ? "User Unblocked!" : "User Blocked!");
    } catch (e) {
      alert("Action failed: " + e.message);
    }
  };

  const deleteRecursively = async (targetId, role) => {
    if (!window.confirm("CRITICAL WARNING: This will permanently wipe ALL DATA related to this user (Menu items, profile, etc). This cannot be undone. Proceed?")) return;
    
    setLoading(true);
    try {
      // 1. If Restaurant, delete menu items first
      if (role === 'vendor' || role === 'restaurant') {
        const menuSnap = await getDocs(collection(db, 'restaurants', targetId, 'menu_items'));
        const batch = writeBatch(db);
        menuSnap.forEach(d => batch.delete(d.ref));
        await batch.commit();
        await deleteDoc(doc(db, 'restaurants', targetId));
      }

      // 2. If Driver, delete driver profile
      if (role === 'driver') {
        await deleteDoc(doc(db, 'delivery_partners', targetId));
      }

      // 3. Delete Core User Profile
      await deleteDoc(doc(db, 'users', targetId));
      
      alert("Target Wiped from Database.");
      if (activeTab === 'users') fetchAllUsers();
      if (activeTab === 'restaurants') fetchRestaurants();
    } catch (e) {
      alert("Deletion failed: " + e.message);
    }
    setLoading(false);
  };

  // --- AUTH SCREEN ---
  if (!session) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <ShieldCheck size={48} color="#FF5A5F" style={{margin: '0 auto', display: 'block', marginBottom: '20px'}} />
          <h1 style={{textAlign: 'center', marginBottom: '10px'}}>Admin Citadel</h1>
          <p style={{textAlign: 'center', color: '#6B7280', marginBottom: '30px'}}>Restricted access portal.</p>
          
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '15px' }}>
             <input required placeholder="SuperAdmin Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} />
             <input required placeholder="Master Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />
             <button type="submit" disabled={authLoading} style={styles.authBtn}>
               {authLoading ? 'Verifying...' : 'INITIALIZE SYSTEM'}
             </button>
          </form>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">Q</div>
          <span className="text-gradient">QuickBite</span>
        </div>
        
        <nav className="nav-links">
          <a href="#" className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <LayoutDashboard size={20} /> Overview
          </a>
          <a href="#" className={`nav-item ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
            <ShieldCheck size={20} /> Approvals
            {pendingUsers.length > 0 && <div style={styles.badgedDot} />}
          </a>
          <a href="#" className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={20} /> User CRM
          </a>
          <a href="#" className={`nav-item ${activeTab === 'restaurants' ? 'active' : ''}`} onClick={() => setActiveTab('restaurants')}>
            <Store size={20} /> Restaurants
          </a>
          <a href="#" className={`nav-item ${activeTab === 'logistics' ? 'active' : ''}`} onClick={() => setActiveTab('logistics')}>
            <Bike size={20} /> Logistics
          </a>
          <a href="#" className={`nav-item`} onClick={() => signOut(auth)}>
            <Settings size={20} /> Settings
          </a>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <h2>{activeTab.replace('_', ' ')} Control Center</h2>
          <div style={{color: '#10B981', fontWeight: 'bold', display:'flex', alignItems:'center', gap: '5px'}}>
            <ShieldCheck size={16}/> ADMIN MODE
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="dashboard-grid">
            <div className="glass-panel metric-card">
              <span className="metric-title">Total Users</span>
              <span className="metric-value">{stats.users}</span>
            </div>
            <div className="glass-panel metric-card">
              <span className="metric-title">Active Partners</span>
              <span className="metric-value">{stats.restaurants}</span>
            </div>
            <div className="glass-panel metric-card">
              <span className="metric-title">Total Orders</span>
              <span className="metric-value">{stats.orders}</span>
            </div>
            <div className="glass-panel metric-card">
              <span className="metric-title">Gross Revenue</span>
              <span className="metric-value">${stats.revenue.toFixed(2)}</span>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ padding: '2rem' }}>
            <h3 style={{marginBottom:'2rem'}}>Global User Registry</h3>
            <div style={styles.tableBox}>
               <table style={{width: '100%', borderCollapse: 'collapse'}}>
                 <thead>
                   <tr style={{borderBottom: '1px solid #374151', textAlign: 'left', color: '#9CA3AF'}}>
                     <th style={{padding: '12px'}}>User</th>
                     <th style={{padding: '12px'}}>Role</th>
                     <th style={{padding: '12px'}}>Status</th>
                     <th style={{padding: '12px', textAlign:'right'}}>Management</th>
                   </tr>
                 </thead>
                 <tbody>
                   {allUsers.map(user => (
                     <tr key={user.id} style={{borderBottom: '1px solid #1F2937'}}>
                        <td style={{padding: '15px'}}>{user.email}</td>
                        <td style={{padding: '15px'}}><span style={styles.roleTag}>{user.role}</span></td>
                        <td style={{padding: '15px'}}>
                          <span style={{color: user.approval_status === 'blocked' ? '#EF4444' : '#10B981'}}>
                            {user.approval_status || 'approved'}
                          </span>
                        </td>
                        <td style={{padding: '15px', textAlign:'right'}}>
                          <button 
                            onClick={() => handleBlockUser(user.id, user.approval_status === 'blocked')}
                            style={{...styles.iconBtn, color: user.approval_status === 'blocked' ? '#10B981' : '#F59E0B'}}
                          >
                            <Ban size={18}/>
                          </button>
                          <button 
                            onClick={() => deleteRecursively(user.id, user.role)}
                            style={{...styles.iconBtn, color: '#EF4444', marginLeft: '10px'}}
                          >
                            <Trash2 size={18}/>
                          </button>
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'logistics' && (
          <div style={{ padding: '2rem' }}>
            <h3 style={{marginBottom:'2rem'}}>Live Fleet Operations</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {activeOrders.map(order => (
                <div key={order.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
                    <div style={styles.orderIconBox}><Package size={24}/></div>
                    <div>
                      <h4 style={{margin: '0 0 5px 0'}}>Order #{order.id.slice(-6)}</h4>
                      <p style={{margin:0, fontSize:'14px', color:'#9CA3AF'}}>Customer: {order.customerName || 'Anonymous'}</p>
                    </div>
                  </div>
                  <div>
                    <span style={{...styles.statusBadge, ...styles[order.status]}}>{order.status}</span>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <p style={{margin:0, fontSize:'12px', color:'#9CA3AF'}}>Driver</p>
                    <p style={{margin:0, fontWeight:'bold'}}>{order.driverId ? `Assigned (${order.driverId.slice(-4)})` : 'SEARCHING...'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h3>Vendor Directory</h3>
              <button onClick={() => setShowAddForm(!showAddForm)} style={styles.primaryBtn}><Plus size={18} /> Add New Restaurant</button>
            </div>

            {showAddForm && (
              <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Register New Vendor</h4>
                <form onSubmit={handleAddRestaurant} style={{ display: 'grid', gap: '1rem' }}>
                  <input required placeholder="Restaurant Name" value={newRest.name} onChange={e => setNewRest({...newRest, name: e.target.value})} style={styles.input} />
                  <input required placeholder="Address" value={newRest.address} onChange={e => setNewRest({...newRest, address: e.target.value})} style={styles.input} />
                  <input placeholder="Image URL (Optional)" value={newRest.image_url} onChange={e => setNewRest({...newRest, image_url: e.target.value})} style={styles.input} />
                  <input type="number" placeholder="Prep Time (mins)" value={newRest.prep_time_mins} onChange={e => setNewRest({...newRest, prep_time_mins: e.target.value})} style={styles.input} />
                  <button type="submit" style={styles.successBtn}>Save to Database</button>
                </form>
              </div>
            )}

            {loading ? <p>Loading registry...</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {restaurants.map(rest => (
                  <div key={rest.id} className="glass-panel" style={{ overflow: 'hidden', position:'relative' }}>
                    <img src={rest.banner_url} alt={rest.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                    <button 
                      onClick={() => deleteRecursively(rest.id, 'restaurant')}
                      style={styles.deleteOverlayBtn}
                    >
                      <Trash2 size={16}/>
                    </button>
                    <div style={{ padding: '1.5rem' }}>
                      <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{rest.name}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>📍 {rest.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div style={{ padding: '2rem' }}>
            <h3 style={{marginBottom: '2rem'}}>Awaiting Clearance</h3>
            {loading ? <p>Scanning matrix...</p> : (
              <div style={styles.tableBox}>
                {pendingUsers.length === 0 ? <p style={{color: '#9CA3AF'}}>No pending approvals currently requesting clearance.</p> : (
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{borderBottom: '1px solid #374151', textAlign: 'left'}}>
                        <th style={{padding: '10px'}}>Account Details</th>
                        <th style={{padding: '10px'}}>Role Request</th>
                        <th style={{padding: '10px'}}>Extra Details</th>
                        <th style={{padding: '10px'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map(user => (
                        <tr key={user.id} style={{borderBottom: '1px solid #1F2937'}}>
                          <td style={{padding: '15px'}}><Mail size={16} style={{display: 'inline', marginRight: '8px'}} /> {user.name}</td>
                          <td style={{padding: '15px', color: user.role === 'vendor' ? '#3B82F6' : '#F59E0B', fontWeight: 'bold'}}>{user.role.toUpperCase()}</td>
                          <td style={{padding: '15px', color: '#9CA3AF'}}>
                            {user.role === 'vendor' ? `📍 ${user.address || 'N/A'}` : `🚴 ${user.vehicle_type || 'N/A'}`}
                          </td>
                          <td style={{padding: '15px'}}>
                            <button onClick={() => handleApprove(user.id)} style={styles.successBtn}>APPROVE ACCESS</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

const styles = {
  authContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F121A' },
  authCard: { background: '#1A1D24', padding: '40px', borderRadius: '15px', border: '1px solid #FF5A5F', width: '350px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#242830', color: 'white', outline: 'none', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  authBtn: { width: '100%', padding: '12px', background: '#FF5A5F', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  primaryBtn: { padding: '0.75rem 1.5rem', backgroundColor: '#3B82F6', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  successBtn: { padding: '0.75rem 1.5rem', backgroundColor: '#10B981', color: 'white', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  tableBox: { backgroundColor: '#1A1D24', padding: '20px', borderRadius: '15px', border: '1px solid #374151' },
  badgedDot: { width: '8px', height: '8px', backgroundColor: '#FF5A5F', borderRadius: '50%', marginLeft: 'auto' },
  roleTag: { background: '#242830', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#3B82F6', fontWeight: '800' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
  orderIconBox: { width: 48, height: 48, background: '#242830', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' },
  pending: { background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' },
  ready: { background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' },
  picked_up: { background: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' },
  delivered: { background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' },
  deleteOverlayBtn: { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '5px', padding: '8px', color: '#EF4444', cursor: 'pointer' }
};
