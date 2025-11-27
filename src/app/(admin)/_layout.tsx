// app/(admin)/_layout.tsx
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // ⛔ Si no es admin, redirigir
    if (!isLoading) {
      if (!user) {
        console.log('⛔ No hay usuario - redirigiendo a login');
        router.replace('/(auth)/iniciarSesion');
      } else if (user.role !== 'admin') {
        console.log('⛔ Usuario no es admin - redirigiendo a home');
        router.replace('/(tabs)/home');
      }
    }
  }, [user, isLoading]);

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Verificando permisos...</Text>
      </View>
    );
  }

  // Si no es admin, no mostrar nada (se redirigirá)
  if (!user || user.role !== 'admin') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Redirigiendo...</Text>
      </View>
    );
  }

  // Usuario es admin, mostrar layout
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: '👑 Panel Admin',
          headerLeft: () => null, 
        }} 
      />
      {/* 🆕 AGREGAR PANTALLAS DE USUARIOS */}
      <Stack.Screen 
        name="usuarios/index" 
        options={{ 
          title: '👥 Gestión de Usuarios',
        }} 
      />
      <Stack.Screen 
        name="usuarios/[id]" 
        options={{ 
          title: '👤 Detalles del Usuario',
        }} 
      />
      <Stack.Screen 
        name="candyOrders/list" 
        options={{ 
          title: '🍿 Pedidos de Golosinas',
        }} 
      />
      <Stack.Screen 
        name="candyOrders/[id]" 
        options={{ 
          title: '📦 Detalle del Pedido',
        }} 
      />
      <Stack.Screen 
        name="candyProducts/list" 
        options={{ 
          title: '🍬 Productos - Golosinas',
        }} 
      />
      <Stack.Screen 
        name="candyProducts/[id]" 
        options={{ 
          title: '📦 Detalles del Producto',
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
});