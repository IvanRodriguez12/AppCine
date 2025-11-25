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
import authService from '@/services/authService';

const IngresarCorreo = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      setEmailError('Formato inválido (ejemplo: usuario@dominio.com)');
    } else {
      setEmailError('');
    }
  };

  const handleContinue = async () => {
    if (!email) {
      setEmailError('Por favor ingresa tu correo electrónico');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Correo electrónico inválido');
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Llamar al backend para enviar código de recuperación
      const result = await authService.forgotPassword({ email });

      if (!result.success) {
        Alert.alert('Error', result.error || 'No se pudo enviar el código');
        return;
      }

      // ✅ Mostrar mensaje de éxito
      Alert.alert(
        'Código enviado',
        'Hemos enviado un código de verificación a tu correo electrónico',
        [
          {
            text: 'OK',
            onPress: () => {
              // ✅ Navegar a verificarCorreo pasando el email
              router.push({
                pathname: '/(auth)/verificarCorreo',
                params: { email }
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al solicitar código:', error);
      Alert.alert('Error', 'Ocurrió un error. Inténtalo de nuevo');
    } finally {
      setIsLoading(false);
    }
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
              width: moderateScale(120),
              height: moderateScale(120),
              resizeMode: 'contain',
              marginBottom: verticalScale(40)
            }}
          />

          {/* Título */}
          <Text style={[styles.title, {color: colors.lightText}]}>
            Recuperar Contraseña
          </Text>
          
          {/* Subtítulo */}
          <Text style={[styles.subtitle, {color: colors.placeholder}]}>
            Ingresa tu correo electrónico y te enviaremos{'\n'}un código de verificación
          </Text>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <Text style={[styles.label, {color: colors.lightText}]}>
              Correo Electrónico
            </Text>
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
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              editable={!isLoading}
            />
            
            {/* Error del correo */}
            {emailError ? (
              <Text style={[styles.errorText, {color: colors.primary}]}>
                {emailError}
              </Text>
            ) : null}
            
            {/* Botón Continuar */}
            <TouchableOpacity 
              style={[
                styles.continueButton, 
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.6 : 1
                }
              ]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>Enviar Código</Text>
              )}
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
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(40),
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    marginBottom: verticalScale(12),
    textAlign: 'center'
  },
  subtitle: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: verticalScale(40),
    lineHeight: moderateScale(22)
  },
  formContainer: {
    width: '100%',
    marginBottom: verticalScale(24)
  },
  label: {
    fontSize: moderateScale(16),
    marginBottom: verticalScale(8)
  },
  input: {
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: verticalScale(8),
    fontSize: moderateScale(16)
  },
  errorText: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(16),
    textAlign: 'left'
  },
  continueButton: {
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    alignItems: 'center',
    marginTop: verticalScale(16)
  },
  continueButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF'
  }
});

export default IngresarCorreo;