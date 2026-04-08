import React from 'react';
import { View, Text } from 'react-native';

export default function MapView({ children, style }) {
  return (
    <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#242830' }]}>
      <Text style={{color: '#A0AEC0', marginBottom: 10}}>🗺️ Maps Render Native Core Libraries</Text>
      <Text style={{color: '#10B981', fontWeight: 'bold'}}>Tracking Simulation Active for Web</Text>
      {children}
    </View>
  );
}

export function UrlTile() {
  return null;
}
