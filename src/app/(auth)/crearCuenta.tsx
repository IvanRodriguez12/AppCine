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
import { moderateScale, verticalScale } from 'react-native-size-matters';

const CrearCuenta = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const colors = {
    primary: '#E50914',
    darkBg: '#000000',
    lightText: '#FFFFFF',
    inputBg: '#333333',
    placeholder: '#8C8C8C',
    divider: '#404040',
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

  const handleRegister = () => {
  if (!fullName || !email || !password) {
    Alert.alert('Error', 'Por favor completa todos los campos');
    return;
  }
  if (emailError) {
    Alert.alert('Error', 'Por favor ingresa un correo válido');
    return;
  }
  
  router.replace('./verificarIdentidad');
};

  const handleLoginRedirect = () => {
  router.push('./iniciarSesion');
};

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
          {/* Logo */}
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={{
              width: moderateScale(200),
              height: moderateScale(194),
              resizeMode: 'contain',
              marginBottom: verticalScale(20)
            }}
          />
          
          {/* Título */}
          <Text style={[styles.title, {color: colors.lightText}]}>Crear Cuenta</Text>
          
          {/* Formulario */}
          <View style={styles.formContainer}>
            <Text style={[styles.label, {color: colors.lightText}]}>Nombre completo</Text>
            <TextInput
              style={[
                styles.input, 
                {
                  backgroundColor: colors.inputBg,
                  color: colors.lightText,
                  borderColor: colors.divider
                }
              ]}
              placeholder="Ingresa tu nombre completo"
              placeholderTextColor={colors.placeholder}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              textContentType="name"
            />
            
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
              placeholder="Crea una contraseña"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
            />
            
            <TouchableOpacity 
              style={[styles.registerButton, {backgroundColor: colors.primary}]}
              onPress={handleRegister}
            >
              <Text style={styles.buttonText}>Crear Cuenta</Text>
            </TouchableOpacity>
          </View>
          
          {/* Enlace para iniciar sesión */}
          <View style={styles.loginContainer}>
            <Text style={{color: colors.placeholder}}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={handleLoginRedirect}>
              <Text style={{color: colors.primary}}>Inicia Sesión</Text>
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
  registerButton: {
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(24),
  },
});

export default CrearCuenta;