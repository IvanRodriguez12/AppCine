import apiClient from '@/api/client';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const filas = 6;
const columnas = 8;
const precioPorAsiento = 5;

const generarAsientos = () => {
  const asientos: string[][] = [];
  for (let f = 0; f < filas; f++) {
    const fila: string[] = [];
    for (let c = 0; c < columnas; c++) {
      const letra = String.fromCharCode(65 + f);
      fila.push(`${letra}${c + 1}`);
    }
    asientos.push(fila);
  }
  return asientos;
};

const Asientos = () => {
  const { id, fecha, hora, showtimeId } = useLocalSearchParams();
  const router = useRouter();
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [asientosOcupados, setAsientosOcupados] = useState<string[]>([]);

  const asientos = generarAsientos();

  // Cargar asientos ocupados desde el backend usando showtimeId
  useEffect(() => {
    const fetchShowtimeSeats = async () => {
      const sId = Array.isArray(showtimeId) ? showtimeId[0] : showtimeId;
      if (!sId) return;

      try {
        const response = await apiClient.get(`/showtimes/${sId}`);
        const data = response.data as any;
        const occupied =
          (data && (data.occupiedSeats || data.asientosOcupados)) || [];
        if (Array.isArray(occupied)) {
          setAsientosOcupados(occupied);
        }
      } catch (error) {
        console.error('Error al cargar asientos ocupados:', error);
      }
    };

    fetchShowtimeSeats();
  }, [showtimeId]);

  const toggleSeleccion = (asiento: string) => {
    if (asientosOcupados.includes(asiento)) return;
    setSeleccionados(prev =>
      prev.includes(asiento)
        ? prev.filter(a => a !== asiento)
        : [...prev, asiento]
    );
  };

  const procederPago = () => {
    if (seleccionados.length === 0) {
      Alert.alert('Atención', 'Debes seleccionar al menos un asiento.');
      return;
    }
    
    const total = seleccionados.length * precioPorAsiento;
    const asientosString = seleccionados.join(', ');
    
    // Navegar al carrito de tickets con los parámetros
    router.push({
      pathname: 'menu/carrito/CarritoTickets',
      params: {
        id,
        fecha,
        hora,
        showtimeId,
        asientos: asientosString,
        total: total.toString()
      }
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Seleccioná tus asientos</Text>

      <ScrollView contentContainerStyle={styles.grid}>
        <View style={styles.screenCurve} />

        {asientos.map((fila, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {fila.map(asiento => {
              const ocupado = asientosOcupados.includes(asiento);
              const seleccionado = seleccionados.includes(asiento);
              return (
                <TouchableOpacity
                  key={asiento}
                  style={[
                    styles.asiento,
                    ocupado && styles.ocupado,
                    seleccionado && styles.seleccionado,
                  ]}
                  onPress={() => toggleSeleccion(asiento)}
                  disabled={ocupado}
                >
                  <MaterialCommunityIcons
                    name="seat"
                    size={30}
                    color={
                      ocupado ? "#ff4444" : seleccionado ? "#00e0b2" : "#ccc"
                    }
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <MaterialCommunityIcons name="seat" size={20} color="#ccc" />
          <Text style={styles.legendText}>Disponible</Text>
        </View>
        <View style={styles.legendItem}>
          <MaterialCommunityIcons name="seat" size={20} color="#ff4444" />
          <Text style={styles.legendText}>Reservado</Text>
        </View>
        <View style={styles.legendItem}>
          <MaterialCommunityIcons name="seat" size={20} color="#00e0b2" />
          <Text style={styles.legendText}>Seleccionado</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.rowInfo}>
          <Ionicons name="calendar-outline" size={18} color="white" />
          <Text style={styles.infoText}>
            {fecha || "Fecha"}  •  {hora || "Hora"}
          </Text>
        </View>
        <View style={styles.rowInfo}>
          <MaterialCommunityIcons name="seat-outline" size={18} color="white" />
          <Text style={styles.infoText}>
            Asientos: {seleccionados.join(', ') || 'Ninguno'}
          </Text>
        </View>
        <View style={styles.rowInfo}>
          <FontAwesome name="shopping-cart" size={18} color="white" />
          <Text style={styles.infoText}>
            Total: ${seleccionados.length * precioPorAsiento}
          </Text>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={procederPago}>
          <Text style={styles.payButtonText}>Proceder al Pago</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 140, 
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    zIndex: 10,
    padding: 8,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 12,
  },
  grid: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 1,
  },
  asiento: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ocupado: {},
  seleccionado: {},
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    color: 'white',
    fontSize: 16,
  },
  summary: {
    position: 'absolute',
    bottom: 40, // desplazado hacia arriba desde el borde inferior
    left: 16,
    right: 16,
    backgroundColor: '#770000',
    padding: 14,
    borderRadius: 16,
    zIndex: 10,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  infoText: {
    color: 'white',
    fontSize: 16,
  },
  payButton: {
    marginTop: 10,
    backgroundColor: 'black',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  screenCurve: {
    height: 4, // línea fina
    width: 140, // base visual
    backgroundColor: '#ff0000',
    borderRadius: 100, // curva completa
    alignSelf: 'center',
    marginBottom: 100,
    transform: [{ scaleX: 2.7 }] // estira horizontalmente
  },
});

export default Asientos;