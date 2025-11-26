import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  Alert, 
  Image, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '@/context/authContext';
import userService from '@/services/userService';

const DatosPersonales = () => {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [editando, setEditando] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [user]);

  const cargarDatos = () => {
    if (user) {
      setNombre(user.displayName || '');
      setEmail(user.email || '');
      setFotoPerfil(user.photoURL || null);
    }
  };

  const guardarDatos = async () => {
    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado');
      return;
    }

    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setGuardando(true);

    try {
      const profileData: any = { displayName: nombre };

      const result = await userService.updateProfile(user.uid, profileData);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Error al actualizar perfil');
        setGuardando(false);
        return;
      }

      await refreshUser();

      setEditando(false);
      Alert.alert('Éxito', 'Datos actualizados correctamente');
    } catch (error) {
      console.error('Error guardando datos:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEdicion = () => {
    cargarDatos();
    setEditando(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="CineApp" onBack={() => router.back()} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* AVATAR */}
          <View style={styles.avatarContainer}>
            {fotoPerfil ? (
              <Image source={{ uri: fotoPerfil }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarDefault}>
                <Ionicons name="person" size={50} color="#bbb" />
              </View>
            )}
          </View>

          <Text style={styles.title}>Datos personales</Text>

          {/* NOMBRE */}
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={[styles.input, !editando && styles.inputDisabled]}
            value={nombre}
            onChangeText={setNombre}
            editable={editando}
            placeholder="Nombre completo"
            placeholderTextColor="#888"
          />

          {/* EMAIL */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              placeholder="Correo electrónico"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>El email no puede modificarse</Text>
          </View>

          {/* MENSAJE SOBRE CONTRASEÑA */}
          {!editando && (
            <View style={styles.passwordHint}>
              <Ionicons name="information-circle-outline" size={18} color="#888" />
              <Text style={styles.passwordHintText}>
                Para cambiar tu contraseña, usa "Olvidé mi contraseña" al iniciar sesión
              </Text>
            </View>
          )}

          {/* BOTONES */}
          {editando ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={cancelarEdicion}
                disabled={guardando}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btn}
                onPress={guardarDatos}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.btnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.btnEdit} 
              onPress={() => setEditando(true)}
            >
              <Ionicons name="pencil" size={18} color="white" />
              <Text style={styles.btnEditText}>Editar datos</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
  },
  avatarDefault: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: 'white',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '500'
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222',
    color: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  inputDisabled: {
    backgroundColor: '#1a1a1a',
    color: '#888',
  },
  helperText: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4
  },
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#333'
  },
  passwordHintText: {
    color: '#888',
    fontSize: 12,
    flex: 1
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  btn: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnSecondary: {
    backgroundColor: '#444',
  },
  btnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  btnEdit: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    alignSelf: 'center',
    minWidth: 150
  },
  btnEditText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default DatosPersonales;
