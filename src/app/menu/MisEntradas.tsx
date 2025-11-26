// src/app/menu/MisEntradas.tsx
import Header from '@/components/Header'; // 👈 AGREGADO
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const COMPRAS_KEY = 'compras_usuario';

type EntradaGuardada = {
  tipo: string;
  pelicula: string;
  fecha: string | string[];
  hora: string | string[];
  asientos: string | string[];
  fechaCompra: string;
  subtotal: number;
  descuento: number;
  cuponUsado: string | null;
  precio: number;
  metodo: string;
  ticketId?: string | null;
  qrCode?: string | null;
  movieId?: string | null;
};

const MisEntradas: React.FC = () => {
  const [entradas, setEntradas] = useState<EntradaGuardada[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const cargarEntradas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(COMPRAS_KEY);

      if (!data) {
        setEntradas([]);
      } else {
        const todas: EntradaGuardada[] = JSON.parse(data);
        const soloEntradas = todas.filter(
          (c) => c.tipo === 'Entrada de cine'
        );
        soloEntradas.sort(
          (a, b) =>
            new Date(b.fechaCompra).getTime() -
            new Date(a.fechaCompra).getTime()
        );
        setEntradas(soloEntradas);
      }
    } catch (error) {
      console.error('Error cargando entradas:', error);
      setEntradas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarEntradas();
    }, [cargarEntradas])
  );

  const handlePressEntrada = (entrada: EntradaGuardada) => {
    router.push({
      pathname: '/menu/MisEntradasDetalle',
      params: { entrada: JSON.stringify(entrada) },
    });
  };

  const renderItem = ({ item }: { item: EntradaGuardada }) => {
    const fechaStr = Array.isArray(item.fecha) ? item.fecha[0] : item.fecha;
    const horaStr = Array.isArray(item.hora) ? item.hora[0] : item.hora;
    const asientosStr = Array.isArray(item.asientos)
      ? item.asientos[0]
      : item.asientos;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePressEntrada(item)}   // 👈 VER DETALLE
      >
        <View style={styles.cardHeader}>
          <Text style={styles.movieTitle}>{item.pelicula}</Text>
          {item.ticketId && (
            <Text style={styles.ticketId}>ID: {item.ticketId}</Text>
          )}
        </View>

        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.infoText}>
            {fechaStr} • {horaStr}
          </Text>
        </View>

        <View style={styles.row}>
          <MaterialCommunityIcons name="seat-outline" size={18} color="#fff" />
          <Text style={styles.infoText}>Asientos: {asientosStr}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="card-outline" size={18} color="#fff" />
          <Text style={styles.infoText}>
            Método: {item.metodo} • Total: ${item.precio.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#ff2b2b" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER DE LA APP */}
      <Header title="Mis Entradas" />

      {/* BOTÓN VOLVER */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={26} color="white" />
      </TouchableOpacity>

      {entradas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="ticket-confirmation-outline"
            size={50}
            color="#777"
          />
          <Text style={styles.emptyText}>
            Todavía no tenés entradas registradas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entradas}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  backButton: {
    position: 'absolute',
    top: 65,
    left: 16,
    zIndex: 50,
  },
  card: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginTop: 20,
  },
  cardHeader: { marginBottom: 6 },
  movieTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  ticketId: { color: '#bbbbbb', fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  infoText: { color: 'white', fontSize: 14 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    color: '#777',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default MisEntradas;