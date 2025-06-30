import Header from '@/components/Header';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native';

const ConfiguracionCuenta = () => {
  const router = useRouter();

  const handleEliminar = () => {
    Alert.alert('Eliminar cuenta', '¿Estás seguro de eliminar tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {/* lógica de eliminación */} },
    ]);
  };

  const handleInhabilitar = () => {
    Alert.alert('Inhabilitar cuenta', '¿Estás seguro de inhabilitar tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Inhabilitar', style: 'destructive', onPress: () => {/* lógica de inhabilitar */} },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="CineApp" onBack={() => router.back()} />
      <Text style={styles.title}>Opciones de cuenta</Text>
      <TouchableOpacity style={styles.btnEliminar} onPress={handleEliminar}>
        <Text style={styles.btnText}>Eliminar cuenta</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnInhabilitar} onPress={handleInhabilitar}>
        <Text style={styles.btnText}>Inhabilitar cuenta</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'black', padding: 24 },
  title: { color: 'white', fontWeight: 'bold', fontSize: 20, marginBottom: 24 },
  btnEliminar: {
    backgroundColor: 'red',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  btnInhabilitar: {
    backgroundColor: '#444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default ConfiguracionCuenta;