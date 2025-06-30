import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [cardData, setCardData] = useState<CardData>({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [metodosGuardados, setMetodosGuardados] = useState<MetodoPago[]>([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<number>(-1);
  const [tarjetasGuardadas, setTarjetasGuardadas] = useState<MetodoPago[]>([]);
  const [billeterasGuardadas, setBilleterasGuardadas] = useState<MetodoPago[]>([]);
  const [mostrarMetodosGuardados, setMostrarMetodosGuardados] = useState<boolean>(true);

  const paymentMethods: PaymentMethod[] = [
    { id: 'visa', name: 'Tarjeta de crédito/débito', icon: 'card', type: 'card' },
    { id: 'mercadopago', name: 'Billetera virtual', icon: 'wallet', type: 'wallet' }
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
        setTarjetasGuardadas(lista.filter(m => m.type === 'card'));
        setBilleterasGuardadas(lista.filter(m => m.type === 'wallet'));
      }
    } catch (error) {
      console.error('Error al cargar métodos guardados:', error);
    }
  };

  const seleccionarMetodoGuardado = (index: number) => {
    const metodo = selectedPayment === 'visa' ? tarjetasGuardadas[index] : billeterasGuardadas[index];
    setMetodoSeleccionado(index);
    setCardData({
      number: metodo.numero,
      expiry: metodo.fecha,
      cvv: metodo.cvv,
      name: `${metodo.nombre} ${metodo.apellido}`
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
      name: ''
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
    if (selectedPayment === 'visa' || selectedPayment === 'mercadopago') {
      const { number, expiry, cvv, name } = cardData;

      const cardNumber = number.replace(/\s/g, '');
      if (cardNumber.length !== 16) {
        Alert.alert('Error', 'El número de tarjeta debe tener 16 dígitos');
        return false;
      }

      if (expiry.length !== 5) {
        Alert.alert('Error', 'Ingrese una fecha de expiración válida (MM/AA)');
        return false;
      }

      const [month, year] = expiry.split('/').map(Number);
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;

      if (month < 1 || month > 12) {
        Alert.alert('Error', 'Mes de expiración inválido');
        return false;
      }

      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        Alert.alert('Error', 'La tarjeta está vencida');
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

    if (!validateCard()) return;

    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() + 1);
    const datos = {
      suscripto: true,
      renovacion: fecha.toISOString()
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
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethod,
        selectedPayment === method.id && styles.paymentMethodSelected
      ]}
      onPress={() => setSelectedPayment(method.id)}
    >
      <View style={styles.paymentMethodContent}>
        <Ionicons
          name={method.icon as any}
          size={24}
          color={selectedPayment === method.id ? '#FF0000' : 'white'}
        />
        <Text
          style={[
            styles.paymentMethodText,
            selectedPayment === method.id && styles.paymentMethodTextSelected
          ]}
        >
          {method.name}
        </Text>
      </View>
      <View
        style={[
          styles.radioButton,
          selectedPayment === method.id && styles.radioButtonSelected
        ]}
      >
        {selectedPayment === method.id && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMetodosGuardados = () => {
    const lista = selectedPayment === 'visa' ? tarjetasGuardadas : selectedPayment === 'mercadopago' ? billeterasGuardadas : [];
    if (!mostrarMetodosGuardados || lista.length === 0) return null;

    return (
      <View style={styles.metodosGuardadosContainer}>
        <Text style={styles.metodosGuardadosTitle}>MÉTODOS GUARDADOS</Text>
        {(selectedPayment === 'visa' ? tarjetasGuardadas : billeterasGuardadas).map((metodo, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.metodoGuardadoItem,
              metodoSeleccionado === index && styles.metodoGuardadoSelected
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
            <View
              style={[
                styles.radioButton,
                metodoSeleccionado === index && styles.radioButtonSelected
              ]}
            >
              {metodoSeleccionado === index && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={styles.nuevoMetodoButton}
          onPress={usarNuevoMetodo}
        >
          <Text style={styles.nuevoMetodoText}>+ Usar nuevo método de pago</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCardForm = () => {
    if (selectedPayment !== 'visa' && selectedPayment !== 'mercadopago') return null;

    return (
      <View style={styles.cardForm}>
        <Text style={styles.cardFormTitle}>
          {selectedPayment === 'visa' ? 'DETALLES DE TARJETA' : 'DETALLES DE BILLETERA'}
        </Text>
        
        {/* Mostrar métodos guardados si los hay */}
        {renderMetodosGuardados()}
        
        {/* Mostrar formulario solo si no hay método seleccionado o si se eligió usar nuevo método */}
        {(metodosGuardados.length === 0 || metodoSeleccionado === -1) && (
          <>
            <TextInput
              style={styles.cardInput}
              placeholder="Número de tarjeta"
              placeholderTextColor="#999"
              value={cardData.number}
              onChangeText={(text) => setCardData({...cardData, number: formatCardNumber(text)})}
              keyboardType="numeric"
              maxLength={19}
            />

            <View style={styles.cardRow}>
              <TextInput
                style={[styles.cardInput, styles.cardInputHalf]}
                placeholder="MM/AA"
                placeholderTextColor="#999"
                value={cardData.expiry}
                onChangeText={(text) => setCardData({...cardData, expiry: formatExpiry(text)})}
                keyboardType="numeric"
                maxLength={5}
              />
              <TextInput
                style={[styles.cardInput, styles.cardInputHalf]}
                placeholder="CVV"
                placeholderTextColor="#999"
                value={cardData.cvv}
                onChangeText={(text) => setCardData({...cardData, cvv: text.replace(/\D/g, '').substring(0, 3)})}
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
              onChangeText={(text) => setCardData({...cardData, name: text})}
              autoCapitalize="words"
            />
          </>
        )}
        
        {/* Si hay un método seleccionado, mostrar los datos autocompletados (solo lectura) */}
        {metodoSeleccionado >= 0 && (
          <View style={styles.datosAutocompletados}>
            <Text style={styles.datosAutocompletadosTitle}>Datos seleccionados:</Text>
            <Text style={styles.datosAutocompletadosText}>
              Tarjeta: **** **** **** {cardData.number.replace(/\s/g, '').slice(-4)}
            </Text>
            <Text style={styles.datosAutocompletadosText}>
              Titular: {cardData.name}
            </Text>
            <Text style={styles.datosAutocompletadosText}>
              Vencimiento: {cardData.expiry}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="CineApp"
        onBack={() => router.back()}
      />

      <Text style={styles.mainTitle}>FINALIZAR COMPRA</Text>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Producto - Suscripción */}
        <View style={styles.suscripcionCard}>
          <Text style={styles.suscripcionTitle}>TU SUSCRIPCIÓN</Text>
          <View style={styles.suscripcionItem}>
            <View style={styles.suscripcionInfo}>
              <Text style={styles.suscripcionNombre}>Suscripción Premium</Text>
              <Text style={styles.suscripcionDetalle}>
                Fecha: {getCurrentDate()}
              </Text>
              <Text style={styles.suscripcionDetalle}>
                Hora: {new Date().toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
            <Text style={styles.suscripcionPrecio}>$9.99</Text>
          </View>
        </View>

        {/* Método de pago */}
        <Text style={styles.sectionTitle}>MÉTODO DE PAGO</Text>
        
        <View style={styles.paymentMethods}>
          {paymentMethods.map(renderPaymentMethod)}
        </View>

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

        {/* Botón finalizar */}
        <TouchableOpacity
          style={styles.finalizarButton}
          onPress={handleFinalizarPago}
        >
          <Text style={styles.finalizarButtonText}>FINALIZAR PAGO</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.checkmarkContainer}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.successTitle}>¡Compra exitosa!</Text>
            <Text style={styles.successMessage}>
              Tu suscripción ha sido activada correctamente
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
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: moderateScale(16),
  },
  mainTitle: {
    fontSize: moderateScale(24),
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: verticalScale(20),
  },
  scrollContent: {
    paddingBottom: verticalScale(30),
  },
  suscripcionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(25),
  },
  suscripcionTitle: {
    fontSize: moderateScale(16),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(15),
  },
  suscripcionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: verticalScale(12),
  },
  suscripcionInfo: {
    flex: 1,
  },
  suscripcionNombre: {
    fontSize: moderateScale(16),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
  },
  suscripcionDetalle: {
    fontSize: moderateScale(14),
    color: '#ccc',
    marginBottom: verticalScale(2),
  },
  suscripcionPrecio: {
    fontSize: moderateScale(20),
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(15),
  },
  paymentMethods: {
    marginBottom: verticalScale(20),
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: 'red',
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
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: 'red',
  },
  radioButtonInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: 'red',
  },
  cardForm: {
    backgroundColor: '#2a2a2a',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    marginBottom: verticalScale(25),
  },
  cardFormTitle: {
    fontSize: moderateScale(16),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(15),
  },
  // Estilos para métodos guardados (igual que CarritoCandy)
  metodosGuardadosContainer: {
    marginBottom: verticalScale(20),
  },
  metodosGuardadosTitle: {
    fontSize: moderateScale(14),
    color: '#ccc',
    fontWeight: 'bold',
    marginBottom: verticalScale(10),
  },
  metodoGuardadoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: verticalScale(8),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  metodoGuardadoSelected: {
    borderColor: 'red',
  },
  metodoGuardadoContent: {
    flex: 1,
  },
  metodoGuardadoNombre: {
    fontSize: moderateScale(14),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(2),
  },
  metodoGuardadoNumero: {
    fontSize: moderateScale(12),
    color: '#ccc',
  },
  nuevoMetodoButton: {
    backgroundColor: '#444',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  nuevoMetodoText: {
    fontSize: moderateScale(14),
    color: '#FF0000',
    fontWeight: 'bold',
  },
  datosAutocompletados: {
    backgroundColor: '#333',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginTop: verticalScale(10),
  },
  datosAutocompletadosTitle: {
    fontSize: moderateScale(14),
    color: '#ccc',
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  datosAutocompletadosText: {
    fontSize: moderateScale(14),
    color: 'white',
    marginBottom: verticalScale(4),
  },
  cardInput: {
    backgroundColor: '#444',
    borderRadius: moderateScale(8),
    padding: moderateScale(15),
    fontSize: moderateScale(16),
    color: 'white',
    marginBottom: verticalScale(12),
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInputHalf: {
    width: '48%',
  },
  summary: {
    backgroundColor: '#2a2a2a',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    marginBottom: verticalScale(25),
  },
  summaryTitle: {
    fontSize: moderateScale(16),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(15),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  summaryText: {
    fontSize: moderateScale(14),
    color: '#ccc',
  },
  summaryPrice: {
    fontSize: moderateScale(14),
    color: '#ccc',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#666',
    paddingTop: verticalScale(8),
    marginTop: verticalScale(8),
  },
  totalText: {
    fontSize: moderateScale(16),
    color: 'white',
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: moderateScale(16),
    color: 'white',
    fontWeight: 'bold',
  },
  finalizarButton: {
    backgroundColor: 'red',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
  },
  finalizarButtonText: {
    fontSize: moderateScale(18),
    color: 'white',
    fontWeight: 'bold',
  },
  // Estilos del modal de éxito
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: moderateScale(16),
    padding: moderateScale(30),
    alignItems: 'center',
    marginHorizontal: moderateScale(40),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkmarkContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
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