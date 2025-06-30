import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const Suscripcion: React.FC = () => {
  const router = useRouter();
  const [suscripto, setSuscripto] = useState(false);
  const [fechaRenovacion, setFechaRenovacion] = useState<string | null>(null);

  useEffect(() => {
    const cargarEstado = async () => {
      const estado = await AsyncStorage.getItem('estadoSuscripcion');
      if (estado) {
        const datos = JSON.parse(estado);
        setSuscripto(datos.suscripto);
        setFechaRenovacion(datos.renovacion);
      }
    };
    cargarEstado();
  }, []);

  const handleCancelarPress = async (): Promise<void> => {
    await AsyncStorage.removeItem('estadoSuscripcion');
    setSuscripto(false);
    setFechaRenovacion(null);
  };

  const formatoFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="CineApp" onBack={() => router.back()} />

      <Text style={styles.mainTitle}>DETALLES SUSCRIPCIÓN</Text>

      <View style={styles.subscriptionCard}>
        <Text style={styles.subscriptionTitle}>Suscripción</Text>
        <Text style={styles.price}>$9.99/mes</Text>
      </View>

      <Text style={styles.benefitsTitle}>Beneficios</Text>

      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.benefitText}>Promociones exclusivas</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.benefitText}>Descuentos especiales</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.benefitText}>Coleccionables limitados</Text>
        </View>
      </View>

      {suscripto && fechaRenovacion ? (
        <>
          <Text style={styles.renovacionTexto}>
            Tu suscripción se renovará el {formatoFecha(fechaRenovacion)}
          </Text>
          <TouchableOpacity style={[styles.buyButton, { backgroundColor: '#888' }]} onPress={handleCancelarPress}>
            <Text style={styles.buyButtonText}>Cancelar suscripción</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.buyButton} onPress={() => router.push('/menu/carrito/CarritoSuscripcion')}>
          <Text style={styles.buyButtonText}>Comprar</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
    alignSelf: 'center'
  },
  subscriptionCard: {
    backgroundColor: '#1c1c1e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  price: {
    fontSize: 16,
    marginTop: 8,
    color: '#fff'
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#fff'
  },
  benefitsList: {
    marginBottom: 24,
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    padding: 10,
    borderRadius: 10
  },
  benefitText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#fff',
  },
  buyButton: {
    backgroundColor: '#a80000',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  renovacionTexto: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  }
});

export default Suscripcion;