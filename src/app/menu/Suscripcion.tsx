import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { db } from '@/app/config/firebase';
import { useAuth } from '@/context/authContext';
import { doc, onSnapshot } from 'firebase/firestore';

const Suscripcion: React.FC = () => {
  const router = useRouter();
  const [suscripto, setSuscripto] = useState(false);
  const [fechaRenovacion, setFechaRenovacion] = useState<string | null>(null);

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState<Date | null>(null);

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

  const formatPremiumDate = (date: Date | null) => {
    if (!date) return 'sin fecha definida';
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatoFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.uid) {
        // Usuario no logueado
        setIsPremium(false);
        setPremiumUntil(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);

        const unsubscribe = onSnapshot(
          ref,
          async (snap) => {
            try {
              if (snap.exists()) {
                const data = snap.data() as any;

                // 🔹 Ajustá estos nombres según tu documento en Firestore
                const isPremiumFlag: boolean = !!data.isPremium;
                const premiumUntilValue: Date | null = data.premiumUntil
                  ? (data.premiumUntil.toDate
                      ? data.premiumUntil.toDate()
                      : new Date(data.premiumUntil))
                  : null;

                const isStillPremium =
                  isPremiumFlag &&
                  (!premiumUntilValue || premiumUntilValue.getTime() > Date.now());

                setIsPremium(isStillPremium);
                setPremiumUntil(premiumUntilValue);

                // espejo en AsyncStorage para compatibilidad con el resto de la app
                const estadoLocal = {
                  suscripto: isStillPremium,
                  renovacion: premiumUntilValue
                    ? premiumUntilValue.toISOString()
                    : null,
                };
                await AsyncStorage.setItem(
                  'estadoSuscripcion',
                  JSON.stringify(estadoLocal)
                );
              } else {
                // Si no hay doc en Firestore intentamos leer lo local
                const local = await AsyncStorage.getItem('estadoSuscripcion');
                if (local) {
                  try {
                    const parsed = JSON.parse(local);
                    const renovacion = parsed.renovacion
                      ? new Date(parsed.renovacion)
                      : null;
                    const isStillPremium =
                      !!parsed.suscripto &&
                      (!renovacion || renovacion.getTime() > Date.now());

                    setIsPremium(isStillPremium);
                    setPremiumUntil(renovacion);
                  } catch {
                    setIsPremium(false);
                    setPremiumUntil(null);
                  }
                } else {
                  setIsPremium(false);
                  setPremiumUntil(null);
                }
              }
            } catch (innerErr) {
              console.error('Error procesando snapshot de suscripción:', innerErr);
            } finally {
              setLoading(false);
            }
          },
          (err) => {
            console.error('Error escuchando suscripción en Firestore:', err);
            Alert.alert(
              'Error',
              'No se pudo obtener el estado de tu suscripción. Intentá más tarde.'
            );
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error cargando suscripción:', error);
        Alert.alert(
          'Error',
          'No se pudo cargar el estado de tu suscripción. Intentá más tarde.'
        );
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user?.uid]);

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

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : isPremium ? (
        <>
          <Text style={styles.tituloEstado}>¡Ya sos usuario Premium! 🎬</Text>
          <Text style={styles.detalleEstado}>
            Tu suscripción es válida hasta: {formatPremiumDate(premiumUntil)}
          </Text>

          {/* Botón para ir al menú o lo que ya tenías */}
          {/* Usá tus propios estilos y componentes */}
        </>
      ) : (
        <>
          <Text style={styles.tituloEstado}>Aún no estás suscripto</Text>
          <Text style={styles.detalleEstado}>
            Suscribite para acceder a beneficios exclusivos.
          </Text>

          <TouchableOpacity
            style={styles.botonSuscribir} // tu estilo actual
            onPress={() => router.push('menu/carrito/CarritoSuscripcion')}
          >
            <Text style={styles.botonSuscribirTexto}>Suscribirme</Text>
          </TouchableOpacity>
        </>
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
  },
   tituloEstado: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  detalleEstado: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 16,
  },
  botonSuscribir: {
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  botonSuscribirTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Suscripcion;