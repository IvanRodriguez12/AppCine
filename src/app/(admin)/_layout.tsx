// app/(admin)/_layout.tsx
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/(auth)/iniciarSesion');
      } else if (user.role !== 'admin') {
        router.replace('/(tabs)/home');
      }
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Redirigiendo...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: '👑 Panel Admin',
          headerLeft: () => null, 
        }} 
      />
      {/* CUPONES */}
      <Stack.Screen 
        name="cupones/index" 
        options={{ title: '🏷️ Gestión de Cupones' }} 
      />
      <Stack.Screen 
        name="cupones/crear" 
        options={{ title: '➕ Crear Cupón' }} 
      />
      <Stack.Screen 
        name="cupones/bulk" 
        options={{ title: '🎯 Creación Masiva' }} 
      />
      <Stack.Screen 
        name="cupones/[id]" 
        options={{ title: '✏️ Editar Cupón' }} 
      />
      {/* USUARIOS */}
      <Stack.Screen 
        name="usuarios/index" 
        options={{ title: '👥 Gestión de Usuarios' }} 
      />
      <Stack.Screen 
        name="usuarios/[id]" 
        options={{ title: '👤 Detalles del Usuario' }} 
      />
      {/* CANDY ORDERS */}
      <Stack.Screen 
        name="candyOrders/index" 
        options={{ title: '🍿 Pedidos de Golosinas' }} 
      />
      <Stack.Screen 
        name="candyOrders/[id]" 
        options={{ title: '📦 Detalle del Pedido' }} 
      />
      {/* CANDY PRODUCTS */}
      <Stack.Screen 
        name="candyProducts/index" 
        options={{ title: '🍬 Productos - Golosinas' }} 
      />
      <Stack.Screen 
        name="candyProducts/[id]" 
        options={{ title: '📦 Detalles del Producto' }} 
      />
      <Stack.Screen 
        name="candyProducts/crear" 
        options={{ title: '➕ Crear Producto' }} 
      />
      <Stack.Screen 
        name="candyProducts/stock" 
        options={{ title: '📊 Gestión de Stock' }} 
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