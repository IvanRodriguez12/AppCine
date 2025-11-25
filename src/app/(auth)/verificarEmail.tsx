import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import authService from '@/services/authService';
import { useAuth } from '@/context/authContext';
import { auth } from '@/app/config/firebase';
import apiClient from '@/api/client';
import { saveUser, getUser } from '@/utils/storage';

const VerificarEmail = () => {
  const { checkAuthFlow, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(true);

  const colors = {
    primary: '#E50914',
    darkBg: '#000000',
    lightText: '#FFFFFF',
    placeholder: '#8C8C8C',
    divider: '#404040',
  };

  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
      const result = await authService.sendVerificationEmail();
      
      if (result.success) {
        setEmailSent(true);
        Alert.alert(
          'Email Enviado',
          'Revisa tu bandeja de entrada y haz clic en el enlace de verificación'
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo enviar el email');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al enviar email');
    } finally {
      setIsLoading(false);
    }
  };

    const handleCheckVerification = async () => {
    setIsLoading(true);
    try {
      // ⏳ Esperar 2 segundos para dar tiempo a Firebase
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 1️⃣ Llamar al backend para sincronizar la verificación
      const response = await apiClient.post('/users/check-email-verification');
      
      if (response.data?.verified) {
        // 2️⃣ Actualizar el usuario local
        const storedUser = await getUser();
        if (storedUser) {
          await saveUser({
            ...storedUser,
            isEmailVerified: true,
            accountLevel: 'verified'
          });
        }

        // 3️⃣ Refrescar usuario en context
        await refreshUser();
        
        Alert.alert(
          '¡Email Verificado!',
          'Tu email ha sido verificado exitosamente',
          [
            {
              text: 'Continuar',
              onPress: async () => {
                // 4️⃣ Continuar con el flujo
                await checkAuthFlow();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Email no verificado',
          'Por favor verifica tu email antes de continuar. Haz clic en el enlace que te enviamos y luego presiona este botón nuevamente.'
        );
      }
    } catch (error: any) {
      console.error('Error verificando:', error);
      Alert.alert('Error', 'No se pudo verificar el email');
    } finally {
      setIsLoading(false);
    }
};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBg }]}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
        />

        <Text style={[styles.title, { color: colors.lightText }]}>
          Verifica tu Email
        </Text>

        <Text style={[styles.subtitle, { color: colors.placeholder }]}>
          Hemos enviado un email de verificación a tu correo.{'\n\n'}
          Haz clic en el enlace del email para verificar tu cuenta antes de continuar.
        </Text>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📧</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }
          ]}
          onPress={emailSent ? handleCheckVerification : handleSendEmail}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {emailSent ? 'Ya verifiqué mi email' : 'Reenviar Email'}
            </Text>
          )}
        </TouchableOpacity>

        {emailSent && (
          <Text style={[styles.hint, { color: colors.placeholder }]}>
            Después de hacer clic en el enlace del email,{'\n'}
            presiona "Ya verifiqué mi email"
          </Text>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(24),
    paddingTop: verticalScale(80),
    alignItems: 'center',
  },
  logo: {
    width: moderateScale(120),
    height: moderateScale(120),
    resizeMode: 'contain',
    marginBottom: verticalScale(40),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
    marginBottom: verticalScale(40),
  },
  iconContainer: {
    marginBottom: verticalScale(40),
  },
  icon: {
    fontSize: moderateScale(80),
  },
  button: {
    width: '100%',
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(24),
    fontStyle: 'italic',
  },
  secondaryButton: {
    padding: verticalScale(12),
  },
  secondaryButtonText: {
    fontSize: moderateScale(16),
  },
});

export default VerificarEmail;