import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const MensajeBienvenida = () => {
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

  // Auto-redirect después de 5 segundos (opcional)
  useEffect(() => {
    const timer = setTimeout(() => {
      // router.replace('/(tabs)/home'); // Descomenta para auto-redirect
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    // Aquí puedes navegar a la pantalla principal de tu app
    // router.replace('/(tabs)/home');
    
    // Por ahora, volvemos al inicio
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBg }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={styles.logo}
          />
        </View>

        {/* Icono de éxito */}
        <View style={styles.successContainer}>
          <View style={[styles.successCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        {/* Mensaje principal */}
        <View style={styles.messageContainer}>
          <Text style={[styles.welcomeTitle, { color: colors.lightText }]}>
            ¡Bienvenido!
          </Text>
          <Text style={[styles.successMessage, { color: colors.lightText }]}>
            Tu cuenta ha sido verificada correctamente
          </Text>
        </View>

        {/* Información adicional */}
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: colors.placeholder }]}>
            Ya puedes acceder a todas las funcionalidades de la aplicación
          </Text>
        </View>

        {/* Botón continuar */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.placeholder }]}>
            Sesión iniciada correctamente
          </Text>
        </View>
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
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(40),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
    resizeMode: 'contain',
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(40),
  },
  successCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(24),
  },
  checkmark: {
    fontSize: moderateScale(40),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
  },
  welcomeTitle: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  successMessage: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    fontWeight: '500',
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    marginBottom: verticalScale(32),
  },
  infoText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  buttonContainer: {
    width: '100%',
    marginBottom: verticalScale(24),
  },
  continueButton: {
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    alignItems: 'center',
    width: '100%',
  },
  continueButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: moderateScale(12),
  },
});

export default MensajeBienvenida;