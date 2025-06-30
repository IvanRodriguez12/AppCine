import Header from '@/components/Header';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ConfiguracionApp = () => {
  const router = useRouter();
  const [idioma, setIdioma] = useState<'Español' | 'Inglés'>('Español');

  const cambiarIdioma = () => {
    setIdioma(idioma === 'Español' ? 'Inglés' : 'Español');
  };

  const borrarDatos = () => {
    Alert.alert(
      'Borrar datos',
      '¿Estás seguro de que deseas borrar todos los datos de la app?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => {/* lógica de borrado */} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="CineApp" onBack={() => router.back()} />

      <View style={styles.section}>
        <Text style={styles.label}>Idioma actual:</Text>
        <TouchableOpacity style={styles.item} onPress={cambiarIdioma}>
          <Text style={styles.itemText}>Cambiar a {idioma === 'Español' ? 'Inglés' : 'Español'}</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 30 }]}>Datos de la app:</Text>
        <TouchableOpacity style={[styles.item, styles.deleteItem]} onPress={borrarDatos}>
          <Text style={[styles.itemText, { color: 'red' }]}>Borrar todos los datos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'black' },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    backgroundColor: '#4a4a4a',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  itemText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  deleteItem: {
    backgroundColor: '#222',
    borderColor: 'red',
    borderWidth: 1,
  },
});

export default ConfiguracionApp;