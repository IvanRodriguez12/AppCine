import Header from '@/components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = 'metodos_pago';
const PLAN_KEY = 'plan_usuario'; 

type MetodoPago = {
  nombre: string;
  apellido: string;
  numero: string;
  fecha: string;
  cvv: string;
};

const MetodosPago = () => {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [form, setForm] = useState<MetodoPago>({
    nombre: '',
    apellido: '',
    numero: '',
    fecha: '',
    cvv: '',
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [plan, setPlan] = useState<'comun' | 'premium'>('comun');

  const router = useRouter();

  useEffect(() => {
    cargarMetodos();
    cargarPlan();
  }, []);

  const cargarMetodos = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) setMetodos(JSON.parse(data));
  };

  const guardarMetodos = async (lista: MetodoPago[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  };

  const cargarPlan = async () => {
    const data = await AsyncStorage.getItem(PLAN_KEY);
    if (data === 'premium' || data === 'comun') setPlan(data);
    // Si no hay nada, por defecto es 'comun'
  };

  const mejorarPlan = async () => {
    await AsyncStorage.setItem(PLAN_KEY, 'premium');
    setPlan('premium');
    Alert.alert('¡Listo!', 'Ahora tienes el plan Premium.');
  };

  const cancelarPlan = async () => {
    await AsyncStorage.setItem(PLAN_KEY, 'comun');
    setPlan('comun');
    Alert.alert('Plan cancelado', 'Has vuelto al plan común.');
  };

  const agregarMetodo = async () => {
    // Validación básica
    if (
      !form.nombre.trim() ||
      !form.apellido.trim() ||
      !form.numero.trim() ||
      !form.fecha.trim() ||
      !form.cvv.trim()
    ) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    if (form.numero.length < 12 || form.numero.length > 19) {
      Alert.alert('Error', 'El número de tarjeta no es válido');
      return;
    }
    if (form.cvv.length < 3 || form.cvv.length > 4) {
      Alert.alert('Error', 'El CVV no es válido');
      return;
    }
    const lista = [...metodos, form];
    setMetodos(lista);
    setForm({ nombre: '', apellido: '', numero: '', fecha: '', cvv: '' });
    setMostrarFormulario(false);
    await guardarMetodos(lista);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header reutilizable con botón para ir atrás */}
      <Header title="Métodos de pago" onBack={() => router.back()} />

      {/* Apartado de plan actual */}
      <View style={styles.planContainer}>
        <Text style={styles.planLabel}>Plan actual:</Text>
        <Text style={[styles.planText, plan === 'premium' && { color: '#FFD700' }]}>
          {plan === 'premium' ? 'Premium' : 'Común'}
        </Text>
        {plan === 'comun' ? (
          <TouchableOpacity style={styles.planBtn} onPress={mejorarPlan}>
            <Text style={styles.planBtnText}>Mejorar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.planBtn, { backgroundColor: '#444' }]} onPress={cancelarPlan}>
            <Text style={styles.planBtnText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={metodos}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>
              {item.nombre} {item.apellido}
            </Text>
            <Text style={styles.text}>
              {`**** **** **** ${item.numero.slice(-4)}`}
            </Text>
            <Text style={styles.text}>Venc: {item.fecha} | CVV: ***</Text>
          </View>
        )}
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
        <View style={styles.formulario}>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor="#888"
            value={form.nombre}
            onChangeText={v => setForm(f => ({ ...f, nombre: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Apellido"
            placeholderTextColor="#888"
            value={form.apellido}
            onChangeText={v => setForm(f => ({ ...f, apellido: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Número de tarjeta"
            placeholderTextColor="#888"
            value={form.numero}
            onChangeText={v => setForm(f => ({ ...f, numero: v.replace(/[^0-9]/g, '') }))}
            keyboardType="numeric"
            maxLength={19}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="MM/AA"
              placeholderTextColor="#888"
              value={form.fecha}
              onChangeText={v => setForm(f => ({ ...f, fecha: v }))}
              maxLength={5}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="CVV"
              placeholderTextColor="#888"
              value={form.cvv}
              onChangeText={v => setForm(f => ({ ...f, cvv: v.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
          <TouchableOpacity style={styles.btn} onPress={agregarMetodo}>
            <Text style={styles.btnText}>Guardar tarjeta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#444', marginTop: 10 }]}
            onPress={() => setMostrarFormulario(false)}
          >
            <Text style={styles.btnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Si hay métodos y no se muestra el formulario, muestra el botón abajo */}
      {metodos.length > 0 && !mostrarFormulario && (
        <TouchableOpacity style={styles.btn} onPress={() => setMostrarFormulario(true)}>
          <Text style={styles.btnText}>Agregar método de pago</Text>
        </TouchableOpacity>
      )}
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
  backBtn: {
    position: 'absolute',
    top: 24,
    left: 16,
    zIndex: 10,
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 4,
  },
  title: { color: 'white', fontWeight: 'bold', fontSize: 22, marginBottom: 18, textAlign: 'center' },
  text: { color: 'white', fontSize: 16, marginBottom: 2 },
  card: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  formulario: {
    marginTop: 20,
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 16,
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
});

export default MetodosPago;