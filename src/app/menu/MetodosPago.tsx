import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = 'metodos_pago'; 
const SUSCRIPCION_KEY = 'estadoSuscripcion';

type MetodoPago = {
  nombre: string;
  apellido: string;
  numero: string;
  fecha: string;
  cvv: string;
  type: 'card' | 'wallet';
};

type EstadoSuscripcion = {
  suscripto: boolean;
  renovacion: string;
};

const MetodosPago = () => {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [form, setForm] = useState<MetodoPago>({
    nombre: '',
    apellido: '',
    numero: '',
    fecha: '',
    cvv: '',
    type: 'card',
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [plan, setPlan] = useState<'comun' | 'premium'>('comun');
  const [estadoSuscripcion, setEstadoSuscripcion] = useState<EstadoSuscripcion | null>(null);
  const [metodoAEditar, setMetodoAEditar] = useState<number>(-1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [metodoABorrar, setMetodoABorrar] = useState<number>(-1);

  const router = useRouter();

  useEffect(() => {
    cargarMetodos();
    cargarEstadoSuscripcion();
  }, []);

  const cargarMetodos = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setMetodos(JSON.parse(data));
    } catch (error) {
      console.error('Error al cargar métodos:', error);
    }
  };

  const guardarMetodos = async (lista: MetodoPago[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (error) {
      console.error('Error al guardar métodos:', error);
    }
  };

  const cargarEstadoSuscripcion = async () => {
    try {
      const data = await AsyncStorage.getItem(SUSCRIPCION_KEY);
      if (data) setEstadoSuscripcion(JSON.parse(data));
    } catch (error) {
      console.error('Error al cargar estado de suscripción:', error);
    }
  };

  const mejorarPlan = async () => {
    router.push('/menu/Suscripcion');
  };

  const cancelarPlan = async () => {
    Alert.alert(
      'Cancelar Suscripción',
      '¿Estás seguro de que quieres cancelar tu suscripción premium?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(SUSCRIPCION_KEY);
            setEstadoSuscripcion(null);
            Alert.alert('Plan cancelado', 'Has vuelto al plan común.');
          },
        },
      ]
    );
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
    const { nombre, apellido, numero, fecha, cvv } = form;
    
    // Validar campos requeridos
    if (!nombre.trim() || !apellido.trim() || !numero.trim() || !fecha.trim() || !cvv.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return false;
    }

    // Validar número de tarjeta (16 dígitos)
    const cardNumber = numero.replace(/\s/g, '');
    if (cardNumber.length !== 16) {
      Alert.alert('Error', 'El número de tarjeta debe tener 16 dígitos');
      return false;
    }

    // Validar fecha de expiración
    if (fecha.length !== 5) {
      Alert.alert('Error', 'Ingrese una fecha de expiración válida (MM/AA)');
      return false;
    }

    const [month, year] = fecha.split('/').map(Number);
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

    // Validar CVV
    if (cvv.length !== 3) {
       Alert.alert('Error', 'El CVV debe tener 3 dígitos');
      return false;
    }

    return true;
  };

  const agregarMetodo = async () => {
    if (!validateCard()) return;

    try {
      let lista: MetodoPago[];
      
      if (metodoAEditar >= 0) {
        // Editar método existente
        lista = [...metodos];
        lista[metodoAEditar] = form;
        Alert.alert('Éxito', 'Método de pago actualizado correctamente');
      } else {
        // Agregar nuevo método
        lista = [...metodos, form];
        Alert.alert('Éxito', 'Método de pago agregado correctamente');
      }
      
      setMetodos(lista);
      await guardarMetodos(lista);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el método de pago');
    }
  };

  const editarMetodo = (index: number) => {
    const metodo = metodos[index];
    setForm(metodo);
    setMetodoAEditar(index);
    setMostrarFormulario(true);
  };

  const confirmarBorrarMetodo = (index: number) => {
    setMetodoABorrar(index);
    setShowDeleteModal(true);
  };

  const borrarMetodo = async () => {
    try {
      const lista = metodos.filter((_, index) => index !== metodoABorrar);
      setMetodos(lista);
      await guardarMetodos(lista);
      setShowDeleteModal(false);
      setMetodoABorrar(-1);
      Alert.alert('Éxito', 'Método de pago eliminado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el método de pago');
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', apellido: '', numero: '', fecha: '', cvv: '', type: 'card' });
    setMostrarFormulario(false);
    setMetodoAEditar(-1);
  };

  const obtenerFechaRenovacion = (): string => {
    if (!estadoSuscripcion?.renovacion) return '';
    const fecha = new Date(estadoSuscripcion.renovacion);
    return fecha.toLocaleDateString('es-ES');
  };

  const renderMetodoItem = ({ item, index }: { item: MetodoPago; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.text}>
          {item.nombre} {item.apellido}
        </Text>
        <Text style={styles.text}>
          {`**** **** **** ${item.numero.slice(-4)}`}
        </Text>
        <Text style={styles.text}>Venc: {item.fecha} | CVV: ***</Text>
        <Text style={styles.text}>Tipo: {item.type === 'card' ? 'Tarjeta' : 'Billetera Virtual'}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => editarMetodo(index)}
        >
          <Ionicons name="pencil" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => confirmarBorrarMetodo(index)}
        >
          <Ionicons name="trash" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Métodos de pago" onBack={() => router.back()} />

      {/* Apartado de plan actual */}
      <View style={styles.planContainer}>
        <Text style={styles.planLabel}>Plan actual:</Text>
        <Text style={[styles.planText, estadoSuscripcion?.suscripto && { color: '#FFD700' }]}>
          {estadoSuscripcion?.suscripto ? 'Premium' : 'Común'}
        </Text>
        
        {estadoSuscripcion?.suscripto ? (
          <>
            <Text style={styles.renovacionText}>Renovación: {obtenerFechaRenovacion()}</Text>
            <TouchableOpacity style={[styles.planBtn, { backgroundColor: '#444' }]} onPress={cancelarPlan}>
              <Text style={styles.planBtnText}>Cancelar Suscripción</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.planBtn} onPress={mejorarPlan}>
            <Text style={styles.planBtnText}>Mejorar a Premium</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={metodos}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderMetodoItem}
        ListEmptyComponent={
          !mostrarFormulario ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.text}>No hay métodos guardados.</Text>
              <TouchableOpacity style={styles.btn} onPress={() => setMostrarFormulario(true)}>
                <Text style={styles.btnText}>Agregar método de pago</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      
      {mostrarFormulario && (
        <>
          <View style={styles.selectorTipo}>
            <TouchableOpacity
              style={[
                styles.tipoBtn,
                form.type === 'card' && styles.tipoBtnActivo,
              ]}
              onPress={() => setForm({ ...form, type: 'card' })}
            >
              <Text style={styles.tipoBtnText}>Tarjeta de Crédito/Débito</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tipoBtn,
                form.type === 'wallet' && styles.tipoBtnActivo,
              ]}
              onPress={() => setForm({ ...form, type: 'wallet' })}
            >
              <Text style={styles.tipoBtnText}>Billetera Virtual</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formulario}>
            <Text style={styles.formTitle}>
              {metodoAEditar >= 0 ? 'Editar método de pago' : 'Nuevo método de pago'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#888"
              value={form.nombre}
              onChangeText={v => setForm(f => ({ ...f, nombre: v }))}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              placeholderTextColor="#888"
              value={form.apellido}
              onChangeText={v => setForm(f => ({ ...f, apellido: v }))}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Número de tarjeta"
              placeholderTextColor="#888"
              value={form.numero}
              onChangeText={v => setForm(f => ({ ...f, numero: formatCardNumber(v) }))}
              keyboardType="numeric"
              maxLength={19}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="MM/AA"
                placeholderTextColor="#888"
                value={form.fecha}
                onChangeText={v => setForm(f => ({ ...f, fecha: formatExpiry(v) }))}
                keyboardType="numeric"
                maxLength={5}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="CVV"
                placeholderTextColor="#888"
                value={form.cvv}
                onChangeText={v => setForm(f => ({ ...f, cvv: v.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={agregarMetodo}>
              <Text style={styles.btnText}>
                {metodoAEditar >= 0 ? 'Actualizar tarjeta' : 'Guardar tarjeta'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#444', marginTop: 10 }]}
              onPress={resetForm}
            >
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Si hay métodos y no se muestra el formulario, muestra el botón abajo */}
      {metodos.length > 0 && !mostrarFormulario && (
        <TouchableOpacity style={styles.btn} onPress={() => setMostrarFormulario(true)}>
          <Text style={styles.btnText}>Agregar método de pago</Text>
        </TouchableOpacity>
      )}

      {/* Modal de confirmación de borrado */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar eliminación</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que quieres eliminar este método de pago?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={borrarMetodo}
              >
                <Text style={styles.modalButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'black', padding: 24 },
  planContainer: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
    alignItems: 'center',
  },
  planLabel: {
    color: '#aaa',
    fontSize: 15,
    marginBottom: 4,
  },
  planText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  renovacionText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  planBtn: {
    backgroundColor: 'red',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  planBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  text: { color: 'white', fontSize: 16, marginBottom: 2 },
  card: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#444',
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  selectorTipo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 10,
  },
  tipoBtn: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tipoBtnActivo: {
    backgroundColor: '#d32f2f',
  },
  tipoBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  formulario: {
    marginTop: 20,
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 16,
  },
  formTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#333',
    color: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: 'red',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 200,
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  confirmButton: {
    backgroundColor: '#d32f2f',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MetodosPago;