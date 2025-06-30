import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = 'usuarioActual';

const DatosPersonales = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [editando, setEditando] = useState(false);
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const usuario = JSON.parse(data);
      setNombre(usuario.fullName || '');
      setEmail(usuario.email || '');
      setFotoPerfil(usuario.fotoPerfil || null);
      setPassword(usuario.password || '');
    }
  };

  const guardarDatos = async () => {
    if (!nombre.trim() || !email.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    const usuario = { fullName: nombre, email, password, fotoPerfil };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    setEditando(false);
    Alert.alert('Éxito', 'Datos guardados correctamente');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Datos personales" onBack={() => router.back()} />

      <View style={styles.avatarContainer}>
        {fotoPerfil ? (
          <Image source={{ uri: fotoPerfil }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarDefault}>
            <Ionicons name="person" size={60} color="#bbb" />
          </View>
        )}
      </View>

      <Text style={styles.title}>Datos personales</Text>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={[styles.input, !editando && styles.inputDisabled]}
        value={nombre}
        onChangeText={setNombre}
        editable={editando}
        placeholder="Nombre completo"
        placeholderTextColor="#888"
      />
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, !editando && styles.inputDisabled]}
        value={email}
        onChangeText={setEmail}
        editable={editando}
        placeholder="Correo electrónico"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Contraseña</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={[
            styles.input,
            { flex: 1 },
            !editando && styles.inputDisabled
          ]}
          value={password}
          onChangeText={setPassword}
          editable={editando}
          placeholder="Contraseña"
          placeholderTextColor="#888"
          secureTextEntry={!mostrarPassword}
        />
        <TouchableOpacity
          onPress={() => setMostrarPassword((v) => !v)}
          style={{ marginLeft: 8 }}
        >
          <Ionicons
            name={mostrarPassword ? 'eye-off' : 'eye'}
            size={22}
            color="#aaa"
          />
        </TouchableOpacity>
      </View>
      {editando ? (
        <TouchableOpacity style={styles.btn} onPress={guardarDatos}>
          <Text style={styles.btnText}>Guardar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.btn} onPress={() => setEditando(true)}>
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'black', padding: 24 },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#333',
  },
  avatarDefault: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: 'white', fontWeight: 'bold', fontSize: 22, marginBottom: 18, textAlign: 'center' },
  label: { color: 'white', fontSize: 16, marginTop: 10 },
  input: {
    backgroundColor: '#222',
    color: 'white',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  inputDisabled: {
    backgroundColor: '#333',
    color: '#aaa',
  },
  btn: {
    backgroundColor: 'red',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default DatosPersonales;