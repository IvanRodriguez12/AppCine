import Header from '@/components/Header';
import cuponesData from '@/data/cupones.json';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

const STORAGE_KEY = 'metodos_pago';
const COMPRAS_KEY = 'compras_usuario';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: 'card' | 'wallet';
}

interface MetodoPago {
  nombre: string;
  apellido: string;
  numero: string;
  fecha: string;
  cvv: string;
  type: 'card' | 'wallet';
}

interface CardData {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

interface Cupon {
  codigo: string;
  titulo: string;
  descripcion: string;
  objeto: 'ticket' | 'candyshop';
  tipo: 'fijo' | 'porcentaje' | '2x1';
  descuento: number | null;
  vencimiento: string;
  icono: string;
  premium: boolean;
}

type Pelicula = {
  poster_path: string;
  title: string;
};

const CarritoTickets: React.FC = () => {
  const { id, fecha, hora, asientos, total } = useLocalSearchParams();
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
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cargando, setCargando] = useState(true);

  const [codigoCupon, setCodigoCupon] = useState<string>('');
  const [cuponAplicado, setCuponAplicado] = useState<Cupon | null>(null);
  const [descuentoAplicado, setDescuentoAplicado] = useState<number>(0);
  const [cargandoCupon, setCargandoCupon] = useState<boolean>(false);

  const cupones: Cupon[] = cuponesData.cupones.map((c) => ({
    ...c,
    objeto: c.objeto as 'ticket' | 'candyshop',
    tipo: c.tipo as 'fijo' | 'porcentaje' | '2x1',
  }));

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

  const validarCupon = async (cupon: Cupon): Promise<{ valido: boolean; mensaje?: string }> => {
    const fechaVencimiento = new Date(cupon.vencimiento);
    const fechaActual = new Date();

    if (fechaVencimiento < fechaActual) {
      return { valido: false, mensaje: 'El cupón ha expirado' };
    }

    if (cupon.objeto !== 'ticket') {
      return { valido: false, mensaje: 'Este cupón no es válido para entradas de cine' };
    }

    if (cupon.premium) {
      try {
        const estado = await AsyncStorage.getItem('estadoSuscripcion');
        const esPremium = estado ? JSON.parse(estado).suscripto === true : false;
        if (!esPremium) {
          return { valido: false, mensaje: 'Este cupón es solo para usuarios Premium' };
        }
      } catch {
        return { valido: false, mensaje: 'Error al verificar suscripción del usuario' };
      }
    }

    if (cupon.tipo === '2x1') {
      const cantidadAsientos = asientos?.toString().split(',').length || 0;
      if (cantidadAsientos < 2) {
        return { valido: false, mensaje: 'Debes seleccionar al menos 2 asientos para usar este cupón' };
      }
    }

    return { valido: true };
  };

  const calcularDescuento = (cupon: Cupon, subtotal: number): number => {
    switch (cupon.tipo) {
      case 'fijo':
        return Math.min(cupon.descuento || 0, subtotal);

      case 'porcentaje':
        return (subtotal * (cupon.descuento || 0)) / 100;

      case '2x1': {
        const cantidadAsientos = asientos?.toString().split(',').length || 0;
        if (cantidadAsientos < 2) return 0;
        const entradasGratis = Math.floor(cantidadAsientos / 2);
        const precioUnitario = subtotal / cantidadAsientos;
        return precioUnitario * entradasGratis;
      }

      default:
        return 0;
    }
  };

  const aplicarCupon = async () => {
    if (!codigoCupon.trim()) {
      Alert.alert('Error', 'Ingrese un código de cupón');
      return;
    }

    setCargandoCupon(true);

    try {
      const cupon = cupones.find(c => c.codigo.toLowerCase() === codigoCupon.trim().toLowerCase());
      
      if (!cupon) {
        Alert.alert('Error', 'Código de cupón inválido');
        setCargandoCupon(false);
        return;
      }

      const validacion = await validarCupon(cupon);
      if (!validacion.valido) {
        Alert.alert('Error', validacion.mensaje || 'Cupón no válido');
        setCargandoCupon(false);
        return;
      }

      const subtotal = parseFloat(total as string);
      const descuento = calcularDescuento(cupon, subtotal);

      setCuponAplicado(cupon);
      setDescuentoAplicado(descuento);
      
      Alert.alert(
        '¡Cupón aplicado!',
        `${cupon.titulo} - ${cupon.descripcion}\nDescuento: $${descuento.toFixed(2)}`
      );

    } catch (error) {
      Alert.alert('Error', 'Error al aplicar el cupón');
    } finally {
      setCargandoCupon(false);
    }
  };

  const quitarCupon = () => {
    setCuponAplicado(null);
    setDescuentoAplicado(0);
    setCodigoCupon('');
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

  const usarNuevoMetodo = () => {
    setMetodoSeleccionado(-1);
    setCardData({
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    });
  };

  const guardarCompra = async () => {
    try {
      const subtotal = parseFloat(total as string);
      const totalFinal = subtotal - descuentoAplicado + 2;

      const nuevaCompra = {
        tipo: 'Entrada de cine',
        pelicula: pelicula?.title || 'Película',
        fecha: fecha,
        hora: hora,
        asientos: asientos,
        fechaCompra: new Date().toISOString(),
        subtotal: subtotal,
        descuento: descuentoAplicado,
        cuponUsado: cuponAplicado?.codigo || null,
        precio: totalFinal,
        metodo: selectedPayment === 'visa' ? 'Tarjeta' : 'Billetera',
      };
      const comprasPrevias = await AsyncStorage.getItem(COMPRAS_KEY);
      const lista = comprasPrevias ? JSON.parse(comprasPrevias) : [];
      lista.push(nuevaCompra);
      await AsyncStorage.setItem(COMPRAS_KEY, JSON.stringify(lista));
    } catch {
    }
  };

  useEffect(() => {
    const fetchPelicula = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?language=es-AR&api_key=${TMDB_API_KEY}`
        );
        const data = await res.json();
        setPelicula(data);
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };

    if (id) fetchPelicula();
  }, [id]);

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

    if (!validateCard()) {
      return;
    }

    await guardarCompra();

    setShowSuccessModal(true);
    
    setTimeout(() => {
      setShowSuccessModal(false);
      setTimeout(() => {
        router.replace('menu/menuPrincipal');
      }, 200);
    }, 3000);
  };

  const renderCuponSection = () => (
    <View style={styles.cuponSection}>
      <Text style={styles.sectionTitle}>CÓDIGO DE CUPÓN</Text>
      
      {!cuponAplicado ? (
        <View style={styles.cuponInputContainer}>
          <TextInput
            style={styles.cuponInput}
            placeholder="Ingrese código de cupón"
            placeholderTextColor="#999"
            value={codigoCupon}
            onChangeText={setCodigoCupon}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.aplicarCuponButton, cargandoCupon && styles.buttonDisabled]}
            onPress={aplicarCupon}
            disabled={cargandoCupon}
          >
            {cargandoCupon ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.aplicarCuponText}>APLICAR</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cuponAplicado}>
          <View style={styles.cuponAplicadoInfo}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.cuponAplicadoTexto}>
              <Text style={styles.cuponAplicadoTitulo}>{cuponAplicado.titulo}</Text>
              <Text style={styles.cuponAplicadoDescripcion}>{cuponAplicado.descripcion}</Text>
              <Text style={styles.cuponAplicadoDescuento}>
                Descuento: ${descuentoAplicado.toFixed(2)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.quitarCuponButton}
            onPress={quitarCupon}
          >
            <Ionicons name="close" size={20} color="#FF0000" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
        {lista.map((metodo, index) => (
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
        
        {renderMetodosGuardados()}

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

  if (cargando || !pelicula) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  const subtotal = parseFloat(total as string);
  const totalFinal = subtotal - descuentoAplicado + 2;

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
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w200${pelicula.poster_path}` }}
              style={styles.moviePoster}
            />
            <View style={styles.movieInfo}>
              <Text style={styles.movieTitle}>{pelicula.title}</Text>
              <Text style={styles.ticketDetail}>Fecha: {fecha}</Text>
              <Text style={styles.ticketDetail}>Hora: {hora}</Text>
              <Text style={styles.ticketDetail}>Asientos: {asientos}</Text>
            </View>
          </View>
          <Text style={styles.ticketPrice}>${total}</Text>
        </View>

        {renderCuponSection()}

        <Text style={styles.sectionTitle}>MÉTODO DE PAGO</Text>
        
        <View style={styles.paymentMethods}>
          {paymentMethods.map(renderPaymentMethod)}
        </View>

        {renderCardForm()}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>RESUMEN</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Entradas</Text>
            <Text style={styles.summaryPrice}>${subtotal.toFixed(2)}</Text>
          </View>
          {cuponAplicado && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, styles.discountText]}>
                Descuento ({cuponAplicado.codigo})
              </Text>
              <Text style={[styles.summaryPrice, styles.discountPrice]}>
                -${descuentoAplicado.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Servicio</Text>
            <Text style={styles.summaryPrice}>$2.00</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalPrice}>${totalFinal.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.finalizarButton}
          onPress={handleFinalizarPago}
        >
          <Text style={styles.finalizarButtonText}>FINALIZAR PAGO</Text>
        </TouchableOpacity>
      </ScrollView>

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
              Tus entradas han sido compradas correctamente
              {cuponAplicado && `\n¡Cupón ${cuponAplicado.codigo} aplicado con éxito!`}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: moderateScale(16),
  },
  cuponSection: {
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(25),
  },
  cuponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  cuponInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    fontSize: moderateScale(16),
    color: 'white',
    marginRight: moderateScale(8),
  },
  aplicarCuponButton: {
    backgroundColor: '#FF0000',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#888',
  },
  aplicarCuponText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  cuponAplicado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: verticalScale(10),
    justifyContent: 'space-between',
  },
  cuponAplicadoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cuponAplicadoTexto: {
    marginLeft: moderateScale(10),
    flex: 1,
  },
  cuponAplicadoTitulo: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(15),
    marginBottom: verticalScale(2),
  },
  cuponAplicadoDescripcion: {
    color: '#ccc',
    fontSize: moderateScale(13),
    marginBottom: verticalScale(2),
  },
  cuponAplicadoDescuento: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  quitarCuponButton: {
    marginLeft: moderateScale(10),
    backgroundColor: 'transparent',
    padding: moderateScale(4),
  },
  discountText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  discountPrice: {
    color: '#4CAF50',
    fontWeight: 'bold',
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
  ticketCard: {
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(25),
  },
  ticketHeader: {
    flexDirection: 'row',
    marginBottom: verticalScale(12),
  },
  moviePoster: {
    width: moderateScale(80),
    height: moderateScale(120),
    borderRadius: moderateScale(8),
    backgroundColor: '#444',
  },
  movieInfo: {
    flex: 1,
    marginLeft: moderateScale(16),
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: moderateScale(18),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  ticketDetail: {
    fontSize: moderateScale(14),
    color: '#ccc',
    marginBottom: verticalScale(4),
  },
  ticketPrice: {
    fontSize: moderateScale(20),
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'right',
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
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: '#FF0000',
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
    borderColor: '#FF0000',
  },
  radioButtonInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#FF0000',
  },
  // Estilos para métodos guardados
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
    borderColor: '#FF0000',
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
  cardForm: {
    backgroundColor: '#4a4a4a',
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
  cardInput: {
    backgroundColor: '#333',
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
    backgroundColor: '#4a4a4a',
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
    backgroundColor: '#FF0000',
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

export default CarritoTickets;