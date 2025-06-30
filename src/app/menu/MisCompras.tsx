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
      <Header title="CineApp" onBack={() => router.back()} />
      <Text style={styles.title}>Mis compras</Text>
      {compras.length === 0 ? (
        <Text style={styles.emptyText}>No tienes compras registradas.</Text>
      ) : (
        <FlatList
          data={compras}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item }) => (
            <View style={styles.compraCard}>
              <Text style={styles.compraText}>{item.tipo || 'Compra realizada'}</Text>

              {item.tipo === 'Productos Candy Shop' && item.productos && (
                <>
                  {item.productos.map((prod: any, idx: number) => (
                    <Text key={idx} style={styles.compraTextSecundario}>
                      • {prod.nombre} ({prod.tamanio}) x{prod.cantidad}
                    </Text>
                  ))}
                </>
              )}

              {item.tipo === 'Entrada de cine' && (
                <>
                  <Text style={styles.compraTextSecundario}>
                    Película: {item.pelicula}
                  </Text>
                  <Text style={styles.compraTextSecundario}>
                    Asientos: {item.asientos}
                  </Text>
                  <Text style={styles.compraTextSecundario}>
                    Fecha: {item.fecha} - Hora: {item.hora}
                  </Text>
                </>
              )}

              {item.tipo === 'Suscripción Premium' && (
                <Text style={styles.compraTextSecundario}>
                  Suscripción mensual activa
                </Text>
              )}

              <Text style={styles.compraTextSecundario}>
                Fecha de compra: {new Date(item.fecha || item.fechaCompra).toLocaleDateString()}
              </Text>
              <Text style={styles.compraTextSecundario}>
                Método: {item.metodo}
              </Text>
              <Text style={styles.compraTextSecundario}>
                Total: ${item.precio?.toFixed(2)}
              </Text>
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