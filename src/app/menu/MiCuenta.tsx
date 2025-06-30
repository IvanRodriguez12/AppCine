import Header from '@/components/Header';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MiCuenta = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Usa el Header reutilizable */}
      <Header title="Mi Cuenta" onBack={() => router.back()} />

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push('/menu/DatosPersonales')}
        >
          <Ionicons name="person-circle-outline" size={28} color="white" />
          <Text style={styles.itemText}>Datos personales</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push('/menu/MetodosPago')}
        >
          <FontAwesome5 name="credit-card" size={24} color="white" />
          <Text style={styles.itemText}>Métodos de pago</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push('/menu/ConfiguracionCuenta')}
        >
          <Ionicons name="settings-outline" size={26} color="white" />
          <Text style={styles.itemText}>Configuración de la cuenta</Text>
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a4a4a',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  itemText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 18,
  },
});

export default MiCuenta;