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

const ReestablecerContrasena = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({
    length: true,
    uppercase: true,
    number: true,
    special: true
  });

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

  const validatePassword = (text) => {
    setPassword(text);
    
    const errors = {
      length: text.length < 8,
      uppercase: !/[A-Z]/.test(text),
      number: !/\d/.test(text),
      special: !/[!@#$%^&*(),.?":{}|<>]/.test(text)
    };
    
    setPasswordErrors(errors);
  };

  const handleContinue = () => {
    // Verificar que la contraseña cumpla todos los requisitos
    const hasErrors = Object.values(passwordErrors).some(error => error);
    
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    
    if (hasErrors) {
      Alert.alert('Error', 'La contraseña no cumple con todos los requisitos');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    
    // Navegar a la pantalla de verificación de identidad
    router.push('/verificarIdentidad');
  };

  const getRequirementStyle = (isError) => ({
    ...styles.requirementText,
    color: isError ? colors.primary : '#4CAF50'
  });

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
              marginBottom: verticalScale(30)
            }}
          />

          {/* Título */}
          <Text style={[styles.title, {color: colors.lightText}]}>
            Reestablecer Contraseña
          </Text>
          
          {/* Subtítulo */}
          <Text style={[styles.subtitle, {color: colors.placeholder}]}>
            Crea una contraseña segura para tu cuenta
          </Text>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Campo Contraseña */}
            <Text style={[styles.label, {color: colors.lightText}]}>
              Contraseña
            </Text>
            <TextInput
              style={[
                styles.input, 
                {
                  backgroundColor: colors.inputBg,
                  color: colors.lightText,
                  borderColor: colors.divider
                }
              ]}
              placeholder="Ingresa tu nueva contraseña"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={validatePassword}
              secureTextEntry
              textContentType="newPassword"
            />

            {/* Requisitos de contraseña */}
            <View style={styles.requirementsContainer}>
              <Text style={getRequirementStyle(passwordErrors.length)}>
                • Al menos 8 caracteres
              </Text>
              <Text style={getRequirementStyle(passwordErrors.uppercase)}>
                • Una letra mayúscula
              </Text>
              <Text style={getRequirementStyle(passwordErrors.number)}>
                • Un número
              </Text>
              <Text style={getRequirementStyle(passwordErrors.special)}>
                • Un carácter especial
              </Text>
            </View>
            
            {/* Campo Confirmar Contraseña */}
            <Text style={[styles.label, {color: colors.lightText}]}>
              Confirmar contraseña
            </Text>
            <TextInput
              style={[
                styles.input, 
                {
                  backgroundColor: colors.inputBg,
                  color: colors.lightText,
                  borderColor: colors.divider
                }
              ]}
              placeholder="Confirma tu nueva contraseña"
              placeholderTextColor={colors.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
            />
            
            {/* Botón Continuar */}
            <TouchableOpacity 
              style={[styles.continueButton, {backgroundColor: colors.primary}]}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>

          {/* Nota adicional */}
          <Text style={[styles.noteText, {color: colors.placeholder}]}>
            Tu contraseña debe ser diferente a las{'\n'}utilizadas anteriormente
          </Text>
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
    marginBottom: verticalScale(8),
    textAlign: 'center'
  },
  subtitle: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: verticalScale(30)
  },
  formContainer: {
    width: '100%',
    marginBottom: verticalScale(20)
  },
  label: {
    fontSize: moderateScale(16),
    marginBottom: verticalScale(8),
    marginTop: verticalScale(8)
  },
  input: {
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
    fontSize: moderateScale(16)
  },
  requirementsContainer: {
    marginBottom: verticalScale(20),
    paddingLeft: moderateScale(8)
  },
  requirementText: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(4)
  },
  continueButton: {
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    alignItems: 'center',
    marginTop: verticalScale(12)
  },
  continueButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  noteText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20)
  }
});

export default ReestablecerContrasena;