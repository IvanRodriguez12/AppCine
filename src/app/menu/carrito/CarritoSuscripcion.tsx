import apiClient from '@/api/client';
import { PAYMENT_ENDPOINTS } from '@/api/endpoints';
import Header from '@/components/Header';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const STORAGE_KEY = 'metodos_pago';
const COMPRAS_KEY = 'compras_usuario';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: 'card' | 'wallet';
}

interface CardData {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

interface MetodoPago {
  nombre: string;
  apellido: string;
  numero: string;
  fecha: string;
  cvv: string;
  type: 'card' | 'wallet';
}

const CarritoSuscripcion: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [cardData, setCardData] = useState<CardData>({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [metodosGuardados, setMetodosGuardados] = useState<MetodoPago[]>([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<number>(-1);
  const [tarjetasGuardadas, setTarjetasGuardadas] = useState<MetodoPago[]>([]);
  const [billeterasGuardadas, setBilleterasGuardadas] = useState<MetodoPago[]>([]);
  const [mostrarMetodosGuardados, setMostrarMetodosGuardados] = useState<boolean>(true);

  const paymentMethods: PaymentMethod[] = [
    { id: 'visa', name: 'Tarjeta de crédito/débito', icon: 'card', type: 'card' },
    { id: 'mercadopago', name: 'Billetera virtual', icon: 'wallet', type: 'wallet' },
  ];

  useEffect(() => {
    cargarMetodosGuardados();
  }, []);

  const cargarMetodosGuardados = async () => {
    try {
      const metodos = await AsyncStorage.getItem(STORAGE_KEY);
      if (metodos) {
        const lista: MetodoPago[] = JSON.parse(metodos);
        setMetodosGuardados(lista);
        setTarjetasGuardadas(lista.filter((m) => m.type === 'card'));
        setBilleterasGuardadas(lista.filter((m) => m.type === 'wallet'));
      }
    } catch (error) {
      console.error('Error al cargar métodos guardados:', error);
    }
  };

  const seleccionarMetodoGuardado = (index: number) => {
    const metodo =
      selectedPayment === 'visa' ? tarjetasGuardadas[index] : billeterasGuardadas[index];
    setMetodoSeleccionado(index);
    setCardData({
      number: metodo.numero,
      expiry: metodo.fecha,
      cvv: metodo.cvv,
      name: `${metodo.nombre} ${metodo.apellido}`,
    });
  };

  const guardarCompra = async () => {
    try {
      const nuevaCompra = {
        tipo: 'Suscripción Premium',
        fecha: new Date().toISOString(),
        precio: 9.99,
        metodo: selectedPayment === 'visa' ? 'Tarjeta' : 'Billetera',
      };
      const comprasPrevias = await AsyncStorage.getItem(COMPRAS_KEY);
      const lista = comprasPrevias ? JSON.parse(comprasPrevias) : [];
      lista.push(nuevaCompra);
      await AsyncStorage.setItem(COMPRAS_KEY, JSON.stringify(lista));
    } catch (error) {
      console.error('Error guardando la compra:', error);
    }
  };

  const usarNuevoMetodo = () => {
    setMetodoSeleccionado(-1);
    setCardData({
      number: '',
      expiry: '',
      cvv: '',
      name: '',
    });
  };

  const getCurrentDate = (): string => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCardNumber = (text: string): string => {
    const cleaned = text.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const limited = cleaned.substring(0, 16);
    const formatted = limited.replace(/(.{4})/g, '$1 ').trim();
    return formatted;
  };

  const formatExpiry = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.substring(0, 4);
    if (limited.length >= 2) {
      return `${limited.substring(0, 2)}/${limited.substring(2)}`;
    }
    return limited;
  };

  const validateCard = (): boolean => {
    if (selectedPayment === 'visa') {
      const { number, expiry, cvv, name } = cardData;

      if (number.replace(/\s/g, '').length !== 16) {
        Alert.alert('Error', 'Número de tarjeta inválido');
        return false;
      }

      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        Alert.alert('Error', 'Fecha de expiración inválida');
        return false;
      }

      if (cvv.length !== 3) {
        Alert.alert('Error', 'El CVV debe tener 3 dígitos');
        return false;
      }

      if (name.trim().length < 2) {
        Alert.alert('Error', 'Ingrese el nombre del titular');
        return false;
      }
    }

    return true;
  };

  const handleFinalizarPago = async (): Promise<void> => {
    if (!selectedPayment) {
      Alert.alert('Error', 'Seleccione un método de pago');
      return;
    }

    if (!user?.uid) {
      Alert.alert(
        'Error',
        'No se encontró el usuario autenticado. Volvé a iniciar sesión e intentá nuevamente.'
      );
      return;
    }

    // 💳 FLUJO 1: Tarjeta (VISA) -> mismo comportamiento local que antes
    if (selectedPayment === 'visa') {
      if (!validateCard()) {
        return;
      }

      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() + 1);
      const datos = {
        suscripto: true,
        renovacion: fecha.toISOString(),
      };

      await AsyncStorage.setItem('estadoSuscripcion', JSON.stringify(datos));

      await guardarCompra();

      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        setTimeout(() => {
          router.replace('menu/menuPrincipal');
        }, 200);
      }, 3000);

      return;
    }

    // 🌐 FLUJO 2: Mercado Pago (billetera / carrousel real)
    if (selectedPayment === 'mercadopago') {
      try {
        const mpResponse = await apiClient.post(
          PAYMENT_ENDPOINTS.CREATE_SUBSCRIPTION_PREFERENCE,
          {
            userId: user.uid,
          }
        );

        const { init_point } = mpResponse.data || {};

        if (!init_point) {
          Alert.alert(
            'Error',
            'No se pudo obtener el enlace de pago de Mercado Pago. Intentá nuevamente.'
          );
          return;
        }

        // Abrimos el checkout real de Mercado Pago (no sandbox)
        await Linking.openURL(init_point);

        Alert.alert(
          'Redirigiendo a Mercado Pago',
          'Completá el pago en Mercado Pago. Una vez aprobado, tu suscripción premium se activará automáticamente.'
        );
      } catch (error: any) {
        console.error('Error al crear preferencia de suscripción MP:', error);

        const mensajeBackend =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Ocurrió un error al conectarse con Mercado Pago. Intentá nuevamente.';

        Alert.alert('Error', mensajeBackend);
      }

      return;
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethod,
        selectedPayment === method.id && styles.paymentMethodSelected,
      ]}
      onPress={() => {
        setSelectedPayment(method.id);
        setMetodoSeleccionado(-1);
        setCardData({
          number: '',
          expiry: '',
          cvv: '',
          name: '',
        });
      }}
    >
      <View style={styles.paymentMethodContent}>
        <Ionicons
          name={method.icon as any}
          size={moderateScale(24)}
          color="white"
        />
        <Text
          style={[
            styles.paymentMethodText,
            selectedPayment === method.id && styles.paymentMethodTextSelected,
          ]}
        >
          {method.name}
        </Text>
      </View>
      <View style={styles.radioButton}>
        {selectedPayment === method.id && <View style={styles.radioButtonInner} />}
      </View>
    </TouchableOpacity>
  );

  const renderMetodosGuardados = () => {
    const lista =
      selectedPayment === 'visa'
        ? tarjetasGuardadas
        : selectedPayment === 'mercadopago'
        ? billeterasGuardadas
        : [];
    if (!mostrarMetodosGuardados || lista.length === 0) return null;

    return (
      <View style={styles.metodosGuardadosContainer}>
        <Text style={styles.metodosGuardadosTitle}>MÉTODOS GUARDADOS</Text>
        {(selectedPayment === 'visa' ? tarjetasGuardadas : billeterasGuardadas).map(
          (metodo, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.metodoGuardadoItem,
                metodoSeleccionado === index && styles.metodoGuardadoSelected,
              ]}
              onPress={() => seleccionarMetodoGuardado(index)}
            >
              <View style={styles.metodoGuardadoContent}>
                <Text style={styles.metodoGuardadoNombre}>
                  {metodo.nombre} {metodo.apellido}
                </Text>
                <Text style={styles.metodoGuardadoNumero}>
                  **** **** **** {metodo.numero.replace(/\s/g, '').slice(-4)}
                </Text>
              </View>
            </TouchableOpacity>
          )
        )}
      </View>
    );
  };

  const renderCardForm = () => {
    if (!selectedPayment) return null;

    return (
      <View style={styles.cardForm}>
        <Text style={styles.sectionTitle}>DATOS DEL MÉTODO SELECCIONADO</Text>

        {renderMetodosGuardados()}

        <TouchableOpacity onPress={usarNuevoMetodo}>
          <Text style={styles.usarNuevoMetodoText}>Usar un nuevo método</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.cardInput}
          placeholder="Número de tarjeta"
          placeholderTextColor="#999"
          value={cardData.number}
          onChangeText={(text) =>
            setCardData({ ...cardData, number: formatCardNumber(text) })
          }
          keyboardType="numeric"
          maxLength={19}
        />

        <View style={styles.cardRow}>
          <TextInput
            style={[styles.cardInput, styles.cardInputHalf]}
            placeholder="MM/AA"
            placeholderTextColor="#999"
            value={cardData.expiry}
            onChangeText={(text) =>
              setCardData({ ...cardData, expiry: formatExpiry(text) })
            }
            keyboardType="numeric"
            maxLength={5}
          />
          <TextInput
            style={[styles.cardInput, styles.cardInputHalf]}
            placeholder="CVV"
            placeholderTextColor="#999"
            value={cardData.cvv}
            onChangeText={(text) =>
              setCardData({
                ...cardData,
                cvv: text.replace(/\D/g, '').substring(0, 3),
              })
            }
            keyboardType="numeric"
            maxLength={3}
            secureTextEntry
          />
        </View>

        <TextInput
          style={styles.cardInput}
          placeholder="Nombre del titular"
          placeholderTextColor="#999"
          value={cardData.name}
          onChangeText={(text) => setCardData({ ...cardData, name: text })}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="CineApp" onBack={() => router.back()} />

      <Text style={styles.mainTitle}>DETALLES SUSCRIPCIÓN</Text>

      {/* Detalle de la suscripción */}
      <View style={styles.subscriptionCard}>
        <View>
          <Text style={styles.subscriptionTitle}>Suscripción Premium</Text>
          <Text style={styles.subscriptionDate}>
            Fecha de compra: {getCurrentDate()}
          </Text>
          <Text style={styles.suscripcionDetalle}>
            Hora:{' '}
            {new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <Text style={styles.suscripcionPrecio}>$9.99</Text>
      </View>

      <Text style={styles.sectionTitle}>MÉTODO DE PAGO</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.paymentMethods}>{paymentMethods.map(renderPaymentMethod)}</View>

        {renderCardForm()}

        {/* Resumen */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>RESUMEN</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Suscripción</Text>
            <Text style={styles.summaryPrice}>$9.99</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalPrice}>$9.99</Text>
          </View>
        </View>

        {/* Botón de compra */}
        <TouchableOpacity style={styles.buyButton} onPress={handleFinalizarPago}>
          <Text style={styles.buyButtonText}>Comprar suscripción</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de éxito */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.checkmarkContainer}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.successTitle}>¡Compra exitosa!</Text>
            <Text style={styles.successMessage}>
              Tu suscripción ha sido activada correctamente. ¡Disfrutá de los beneficios
              premium!
            </Text>
            <Text style={styles.countdownText}>
              Se cerrará automáticamente en 3 segundos
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 👇 acá mantengo todos tus estilos tal cual estaban,
  // solo copiados del archivo original (no los modifico)
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 16,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
    alignSelf: 'center',
  },
  subscriptionCard: {
    backgroundColor: '#1c1c1e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  subscriptionDate: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  suscripcionDetalle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  suscripcionPrecio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  paymentMethods: {
    marginBottom: verticalScale(20),
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1e',
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(10),
  },
  paymentMethodSelected: {
    borderColor: '#fff',
    borderWidth: 1,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodText: {
    fontSize: moderateScale(16),
    color: 'white',
    marginLeft: moderateScale(12),
  },
  paymentMethodTextSelected: {
    color: 'white',
  },
  radioButton: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: '#fff',
  },
  cardForm: {
    backgroundColor: '#1c1c1e',
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(20),
  },
  usarNuevoMetodoText: {
    color: '#FF9500',
    marginBottom: verticalScale(10),
    fontSize: moderateScale(14),
  },
  cardInput: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInputHalf: {
    flex: 1,
    marginRight: 8,
  },
  summary: {
    backgroundColor: '#1c1c1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#ccc',
  },
  summaryPrice: {
    fontSize: 14,
    color: '#fff',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
    marginTop: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  buyButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  metodosGuardadosContainer: {
    marginBottom: verticalScale(15),
  },
  metodosGuardadosTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metodoGuardadoItem: {
    backgroundColor: '#2c2c2e',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  metodoGuardadoSelected: {
    borderWidth: 1,
    borderColor: '#fff',
  },
  metodoGuardadoContent: {
    flexDirection: 'column',
  },
  metodoGuardadoNombre: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  metodoGuardadoNumero: {
    color: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    padding: moderateScale(20),
    borderRadius: moderateScale(16),
    width: '80%',
    alignItems: 'center',
  },
  checkmarkContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    borderWidth: 3,
    borderColor: '#00C851',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  checkmark: {
    fontSize: moderateScale(30),
    color: 'white',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: moderateScale(22),
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  successMessage: {
    fontSize: moderateScale(16),
    color: '#ccc',
    textAlign: 'center',
    marginBottom: verticalScale(15),
    lineHeight: moderateScale(22),
  },
  countdownText: {
    fontSize: moderateScale(14),
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CarritoSuscripcion;