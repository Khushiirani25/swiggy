import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [activeRestaurant, setActiveRestaurant] = useState(null); // Track which restaurant we are ordering from

  const addToCart = (item, restaurant) => {
    // If cart has items from a different restaurant, warn or clear. For simplicity, we just clear it or enforce single restaurant.
    if (activeRestaurant && activeRestaurant.id !== restaurant.id && cartItems.length > 0) {
      alert("You can only order from one restaurant at a time. Cart cleared for new restaurant.");
      setCartItems([]);
    }
    
    setActiveRestaurant(restaurant);

    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity === 1) {
        return prev.filter(i => i.id !== itemId);
      }
      return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const clearCart = () => setCartItems([]);

  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, subtotal, activeRestaurant }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
