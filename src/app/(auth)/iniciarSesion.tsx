import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const IniciarSesion = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'gmail' | null>(null);

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

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (emailError) {
      Alert.alert('Error', 'Por favor ingresa un correo válido');
      return;
    }
    Alert.alert(
      'Inicio de sesión', 
      `Credenciales recibidas:\nEmail: ${email}`,
      //[{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
      [{ text: 'OK' }]
    );
  };

  //const handleForgotPassword = () => router.push('/recuperar-password');
  //const handleRegister = () => router.push('/registro');
  
  const handleSocialLogin = (provider: 'google' | 'gmail') => {
    setSelectedProvider(provider);
    Alert.alert(
      `${provider === 'google' ? 'Google' : 'Gmail'} Login`, 
      `Integración con ${provider === 'google' ? 'Google' : 'Gmail'} pendiente`,
      [{ text: 'OK' }]
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
              //onPress={handleForgotPassword}
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
          
          <View style={styles.divider}>
            <View style={[styles.dividerLine, {backgroundColor: colors.divider}]} />
            <Text style={[styles.dividerText, {color: colors.placeholder}]}>o</Text>
            <View style={[styles.dividerLine, {backgroundColor: colors.divider}]} />
          </View>
          
          <View style={styles.socialLoginContainer}>
            {['google', 'gmail'].map((provider) => (
  <TouchableOpacity
    key={provider}
    style={[
      styles.socialButton,
      {
        backgroundColor: colors.socialButtonBg,
        borderColor: colors.divider
      },
      selectedProvider === provider && {
        borderColor: colors.primary,
        backgroundColor: '#2A1A1A'
      }
    ]}
    onPress={() => handleSocialLogin(provider as 'google' | 'gmail')}
  >
    <Image
      source={provider === 'google' 
        ? require('../../assets/images/google-logo.png')
        : require('../../assets/images/gmail-new.png')
      }
      style={{
        width: moderateScale(24),
        height: moderateScale(24),
        marginRight: moderateScale(12),
        resizeMode: 'contain'
      }}
    />
    <Text style={[styles.socialButtonText, {color: colors.lightText}]}>
      Continuar con {provider === 'google' ? 'Google' : 'Gmail'}
    </Text>
  </TouchableOpacity>
))}
          </View>
          
          <View style={styles.registerContainer}>
            <Text style={{color: colors.placeholder}}>¿No tienes cuenta? </Text>
            <TouchableOpacity /*onPress={handleRegister}*/>
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
  socialLoginContainer: {
    marginBottom: verticalScale(24),
    width: '100%'
  },
  socialButton: {
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    marginBottom: verticalScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  checkbox: {
    fontSize: moderateScale(16),
  },
  socialButtonText: {
    fontSize: moderateScale(16),
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(16),
  },
});

export default IniciarSesion;