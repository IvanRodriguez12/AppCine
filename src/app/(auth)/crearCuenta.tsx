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
  View,
  ActivityIndicator
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import authService from '@/services/authService';

const CrearCuenta = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [emailError, setEmailError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const validatePassword = (text: string) => {
    setPassword(text);
    
    if (text.length === 0) {
      setPasswordError('');
      return;
    }

    const errors: string[] = [];

    if (text.length < 8) {
      errors.push('• Mínimo 8 caracteres');
    }

    if (!/[A-Z]/.test(text)) {
      errors.push('• Una letra mayúscula');
    }

    if (!/[a-z]/.test(text)) {
      errors.push('• Una letra minúscula');
    }

    if (!/[0-9]/.test(text)) {
      errors.push('• Un número');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(text)) {
      errors.push('• Un caracter especial (!@#$%...)');
    }

    if (errors.length > 0) {
      setPasswordError('La contraseña debe tener:\n' + errors.join('\n'));
    } else {
      setPasswordError('');
    }
  };

  const validateBirthDate = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;

    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    }

    setBirthDate(formatted);

    if (formatted.length === 10) {
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
      if (!dateRegex.test(formatted)) {
        setBirthDateError('Formato inválido (DD/MM/AAAA)');
      } else {
        const [day, month, year] = formatted.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
          age--;
        }
        
        if (age < 18) {
          setBirthDateError('Debes tener al menos 18 años');
        } else {
          setBirthDateError('');
        }
      }
    } else if (formatted.length > 0 && formatted.length < 10) {
      setBirthDateError('Formato incompleto (DD/MM/AAAA)');
    } else {
      setBirthDateError('');
    }
  };

  const handleRegister = async () => {
    // Validaciones
    if (!fullName || !email || !password || !birthDate) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (emailError) {
      Alert.alert('Error', 'Por favor ingresa un correo válido');
      return;
    }

    if (birthDateError) {
      Alert.alert('Error', birthDateError);
      return;
    }

    if (passwordError) {
      Alert.alert('Error', 'La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
      const [day, month, year] = birthDate.split('/');
      const formattedBirthDate = `${year}-${month}-${day}`;

      console.log('📤 Iniciando registro...');

      const result = await authService.register({
        email,
        password,
        displayName: fullName,
        birthDate: formattedBirthDate,
        acceptTerms: true,
      });

      if (!result.success) {
        console.error('❌ Error en registro:', result.error);
        Alert.alert('Error', result.error || 'No se pudo crear la cuenta');
        return;
      }

      console.log('✅ Registro exitoso');

      // Registro Y login exitosos
      Alert.alert(
        '¡Cuenta Creada!',
        'Tu cuenta ha sido creada y has iniciado sesión exitosamente. Ahora verifica tu identidad.',
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/(auth)/verificarIdentidad')
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Error al registrar:', error);
      Alert.alert(
        'Error',
        error.message || 'Ocurrió un error al registrar el usuario'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    router.push('/(auth)/iniciarSesion');
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
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={{
              width: moderateScale(200),
              height: moderateScale(194),
              resizeMode: 'contain',
              marginBottom: verticalScale(20)
            }}
          />
          <Text style={[styles.title, {color: colors.lightText}]}>Crear Cuenta</Text>
          
          <View style={styles.formContainer}>
            {/* Nombre completo */}
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
              editable={!isLoading}
            />

            {/* Correo electrónico */}
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
              editable={!isLoading}
            />
            {emailError && (
              <Text style={{color: colors.primary, fontSize: moderateScale(12), marginTop: verticalScale(-12), marginBottom: verticalScale(16)}}>
                {emailError}
              </Text>
            )}

            {/* Fecha de nacimiento */}
            <Text style={[styles.label, {color: colors.lightText}]}>Fecha de nacimiento</Text>
            <TextInput
              style={[
                styles.input, 
                {
                  backgroundColor: colors.inputBg,
                  color: colors.lightText,
                  borderColor: birthDateError ? colors.primary : colors.divider
                }
              ]}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.placeholder}
              value={birthDate}
              onChangeText={validateBirthDate}
              keyboardType="numeric"
              maxLength={10}
              editable={!isLoading}
            />
            {birthDateError && (
              <Text style={{color: colors.primary, fontSize: moderateScale(12), marginTop: verticalScale(-12), marginBottom: verticalScale(16)}}>
                {birthDateError}
              </Text>
            )}

            {/* Contraseña */}
            <Text style={[styles.label, { color: colors.lightText }]}>Contraseña</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.lightText,
                    borderColor: passwordError ? colors.primary : colors.divider,
                    paddingRight: moderateScale(50), 
                  },
                ]}
                placeholder="Mín. 8 caracteres, mayús, minus, número y especial"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={validatePassword}
                secureTextEntry={!mostrarPassword}
                textContentType="newPassword"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: moderateScale(10),
                  top: moderateScale(14),
                }}
                onPress={() => setMostrarPassword((prev) => !prev)}
                disabled={isLoading}
              >
                <Ionicons
                  name={mostrarPassword ? 'eye-off' : 'eye'}
                  size={32}
                  color={colors.placeholder}
                />
              </TouchableOpacity>
            </View>
            {passwordError && (
              <Text style={{
                color: colors.primary, 
                fontSize: moderateScale(11), 
                marginTop: verticalScale(-12), 
                marginBottom: verticalScale(16),
                lineHeight: moderateScale(16)
              }}>
                {passwordError}
              </Text>
            )}

            {/* Botón Crear Cuenta */}
            <TouchableOpacity 
              style={[
                styles.registerButton, 
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1
                }
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.lightText} />
              ) : (
                <Text style={styles.buttonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Link a iniciar sesión */}
          <View style={styles.loginContainer}>
            <Text style={{color: colors.placeholder}}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={handleLoginRedirect} disabled={isLoading}>
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