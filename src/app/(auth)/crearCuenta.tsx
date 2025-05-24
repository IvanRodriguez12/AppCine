import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { router } from 'expo-router';
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
    socialButtonBg: '#1A1A1A'
  };

  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text && !emailRegex.test(text)) {
      setEmailError('Ingresa un correo válido');
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
    Alert.alert(
      'Registro exitoso',
      `Bienvenido ${fullName}`,
      //[{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
    );
  };

  const handleGoogleRegister = () => {
    Alert.alert(
      'Google Login', 
      'Integración con Google pendiente'
    );
  };

  const handleGmailRegister = () => {
    Alert.alert(
      'Gmail Login', 
      'Integración con Gmail pendiente'
    );
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
              keyboardType="email-address"
              autoCapitalize="none"
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
            />
            
            <TouchableOpacity 
              style={[styles.registerButton, {backgroundColor: colors.primary}]}
              onPress={handleRegister}
            >
              <Text style={styles.buttonText}>Crear Cuenta</Text>
            </TouchableOpacity>
          </View>
          
          {/* Divisor */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, {backgroundColor: colors.divider}]} />
            <Text style={[styles.dividerText, {color: colors.placeholder}]}>o</Text>
            <View style={[styles.dividerLine, {backgroundColor: colors.divider}]} />
          </View>
          
          {/* Botones sociales */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity 
              style={[styles.socialButton, {backgroundColor: colors.socialButtonBg}]}
              onPress={handleGoogleRegister}
            >
              <Image
                source={require('../../assets/images/google-logo.png')}
                style={{
                  width: moderateScale(24),
                  height: moderateScale(24),
                  marginRight: moderateScale(12)
                }}
              />
              <Text style={[styles.socialButtonText, {color: colors.lightText}]}>Registrarse con Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, {backgroundColor: colors.socialButtonBg}]}
              onPress={handleGmailRegister}
            >
              <Image
                source={require('../../assets/images/gmail-new.png')}
                style={{
                  width: moderateScale(24),
                  height: moderateScale(24),
                  marginRight: moderateScale(12)
                }}
              />
              <Text style={[styles.socialButtonText, {color: colors.lightText}]}>Registrarse con Gmail</Text>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(24),
    width: '100%'
  },
  dividerLine: {
    flex: 1,
    height: verticalScale(1),
  },
  dividerText: {
    marginHorizontal: moderateScale(16),
    fontSize: moderateScale(16),
  },
  socialButtonsContainer: {
    width: '100%',
    marginBottom: verticalScale(24),
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    marginBottom: verticalScale(12),
    borderColor: '#404040',
  },
  socialButtonText: {
    fontSize: moderateScale(16),
  },
});

export default CrearCuenta; 