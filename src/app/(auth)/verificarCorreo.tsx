import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef } from 'react';
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
import apiClient from '@/api/client';

const VerificarCorreo = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

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

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus al siguiente input si se ingresa un dígito
    if (text && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Si se presiona backspace y el campo está vacío, ir al anterior
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const codeString = code.join('');
    
    if (codeString.length !== 4) {
      Alert.alert('Error', 'Por favor ingresa el código completo de 4 dígitos');
      return;
    }

    if (!/^\d{4}$/.test(codeString)) {
      Alert.alert('Error', 'El código debe contener solo números');
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Verificar el código con el backend
      const response = await apiClient.post('/users/verify-reset-code', {
        email,
        code: codeString
      });

      if (!response.data?.valid) {
        Alert.alert('Error', 'Código inválido o expirado');
        return;
      }

      // Navegar a reestablecer contraseña con el código verificado
      Alert.alert(
        'Código verificado',
        'Tu código es válido. Ahora crea una nueva contraseña',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push({
                pathname: '/(auth)/reestablecerContrasena',
                params: { 
                  email,
                  code: codeString
                }
              });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error al verificar código:', error);
      const errorMsg = error.response?.data?.error || 'Código inválido o expirado';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'No se pudo reenviar el código');
      return;
    }

    setIsResending(true);

    try {
      // ✅ Llamar nuevamente a forgotPassword para reenviar el código
      const result = await authService.forgotPassword({ email });

      if (!result.success) {
        Alert.alert('Error', result.error || 'No se pudo reenviar el código');
        return;
      }

      Alert.alert('Código reenviado', 'Hemos enviado un nuevo código a tu correo');
      
      // Limpiar el código actual
      setCode(['', '', '', '']);
      inputRefs[0].current?.focus();
    } catch (error) {
      console.error('Error al reenviar código:', error);
      Alert.alert('Error', 'Ocurrió un error. Inténtalo de nuevo');
    } finally {
      setIsResending(false);
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
            Verificar Código
          </Text>
          
          {/* Subtítulo */}
          <Text style={[styles.subtitle, {color: colors.placeholder}]}>
            Hemos enviado un código de 4 dígitos a
          </Text>

          {/* Email mostrado */}
          <Text style={[styles.emailText, {color: colors.lightText}]}>
            {email}
          </Text>

          {/* Inputs para el código */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.lightText,
                    borderColor: colors.divider
                  }
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text.slice(-1), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                textAlign="center"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
              />
            ))}
          </View>

          {/* Botón Verificar */}
          <TouchableOpacity 
            style={[
              styles.verifyButton, 
              {
                backgroundColor: colors.primary,
                opacity: isLoading ? 0.6 : 1
              }
            ]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verificar</Text>
            )}
          </TouchableOpacity>

          {/* Opción de reenviar código */}
          <View style={styles.resendContainer}>
            <Text style={{color: colors.placeholder}}>¿No recibiste el código?</Text>
            <TouchableOpacity 
              onPress={handleResendCode}
              disabled={isResending}
            >
              <Text style={{
                color: isResending ? colors.placeholder : colors.primary, 
                marginLeft: 5
              }}>
                {isResending ? 'Reenviando...' : 'Reenviar código'}
              </Text>
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
    marginBottom: verticalScale(8),
    lineHeight: moderateScale(22)
  },
  emailText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: verticalScale(40)
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: verticalScale(40)
  },
  codeInput: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(8),
    fontSize: moderateScale(24),
    fontWeight: 'bold'
  },
  verifyButton: {
    width: '100%',
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(24)
  },
  verifyButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default VerificarCorreo;