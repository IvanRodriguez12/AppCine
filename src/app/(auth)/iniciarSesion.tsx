import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const IniciarSesion = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const colors = {
    primary: '#E50914',
    darkBg: '#000000',
    lightText: '#FFFFFF',
    darkText: '#333333',
    inputBg: '#333333',
    placeholder: '#8C8C8C',
    divider: '#404040',
    socialButtonBg: '#1A1A1A'
  };

  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text && !emailRegex.test(text)) {
      setEmailError('Ingresa un correo válido (ejemplo@dominio.com)');
    } else {
      setEmailError('');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (emailError) {
      Alert.alert('Error', 'Por favor ingresa un correo válido');
      return;
    }

    try {
      const usuariosGuardados = await AsyncStorage.getItem('usuarios');
      const usuarios = usuariosGuardados ? JSON.parse(usuariosGuardados) : [];

      const usuario = usuarios.find((u: any) => u.email === email && u.password === password);
      if (usuario) {
        // ✅ GUARDAMOS EL OBJETO COMPLETO (no solo el email)
        await AsyncStorage.setItem('usuarioActual', JSON.stringify(usuario));
        router.replace('./mensajeBienvenida');
      } else {
        Alert.alert('Error', 'Correo o contraseña incorrectos');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Alert.alert('Error', 'Ocurrió un error al intentar iniciar sesión');
    }
  };

  const handleForgotPassword = () => {
    router.push('./ingresarCorreo');
  };

  const handleRegister = () => router.push('./crearCuenta');

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.darkBg}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={{
              width: moderateScale(200),
              height: moderateScale(194),
              resizeMode: 'contain',
              marginBottom: verticalScale(20)
            }}
          />
          
          <Text style={[styles.title, {color: colors.lightText}]}>Iniciar Sesión</Text>
          
          <View style={styles.formContainer}>
            <Text style={[styles.label, {color: colors.lightText}]}>Correo electrónico</Text>
            <TextInput
              style={[
                styles.input, 
                {
                  backgroundColor: colors.inputBg,
                  color: colors.lightText,
                  borderColor: emailError ? colors.primary : colors.divider
                }
              ]}
              placeholder="Ingresa tu correo electrónico"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={validateEmail}
              onBlur={() => {
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setEmailError('Formato inválido (ejemplo: usuario@dominio.com)');
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />
            {emailError && (
              <Text style={{color: colors.primary, fontSize: moderateScale(12), marginTop: verticalScale(-12), marginBottom: verticalScale(16)}}>
                {emailError}
              </Text>
            )}
            
            <Text style={[styles.label, {color: colors.lightText}]}>Contraseña</Text>
            <TextInput
              style={[
                styles.input, 
                {
                  backgroundColor: colors.inputBg,
                  color: colors.lightText,
                  borderColor: colors.divider
                }
              ]}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />
            
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={{color: colors.primary}}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.loginButton, {backgroundColor: colors.primary}]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.registerContainer}>
            <Text style={{color: colors.placeholder}}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={{color: colors.primary}}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(24),
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(40),
    alignItems: 'center'
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    marginBottom: verticalScale(32),
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: verticalScale(24),
  },
  label: {
    fontSize: moderateScale(16),
    marginBottom: verticalScale(8),
  },
  input: {
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
    fontSize: moderateScale(16),
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: verticalScale(24),
  },
  loginButton: {
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(24),
  },
});

export default IniciarSesion;