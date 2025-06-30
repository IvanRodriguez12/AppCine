import Header from '@/components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const STORAGE_KEY = 'compras_usuario';

const MisCompras = () => {
  const [compras, setCompras] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const cargarCompras = async () => {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setCompras(JSON.parse(data));
      }
    };
    cargarCompras();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Mis compras" onBack={() => router.back()} />
      <Text style={styles.title}>Mis compras</Text>
      {compras.length === 0 ? (
        <Text style={styles.emptyText}>No tienes compras registradas.</Text>
      ) : (
        <FlatList
          data={compras}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item }) => (
            <View style={styles.compraCard}>
              <Text style={styles.compraText}>{item.descripcion || 'Compra realizada'}</Text>
              <Text style={styles.compraTextSecundario}>{item.fecha || ''}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'black', padding: 24 },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 18,
    textAlign: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  compraCard: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  compraText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 4,
  },
  compraTextSecundario: {
    color: '#aaa',
    fontSize: 14,
  },
});

export default MisCompras;