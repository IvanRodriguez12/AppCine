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
  TouchableOpacity,
  View
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import * as ImagePicker from 'expo-image-picker';

const VerificarIdentidad = () => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);

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

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
      return false;
    }
    return true;
  };

  const pickImage = async (type) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        if (type === 'front') {
          setFrontImage(result.assets[0].uri);
        } else {
          setBackImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleContinue = () => {
    if (!frontImage || !backImage) {
      Alert.alert('Error', 'Por favor sube ambas fotos de tu DNI');
      return;
    }

    Alert.alert(
      'Éxito',
      'Identidad verificada correctamente',
      [{ 
        text: 'OK', 
        onPress: () => {
          router.replace('/Scan');
        }
      }]
    );
  };

  const ImageUploadBox = ({ title, image, onPress }) => (
    <TouchableOpacity 
      style={[styles.imageBox, { borderColor: colors.divider }]}
      onPress={onPress}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.uploadedImage} />
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={[styles.cameraIcon, { backgroundColor: colors.inputBg }]}>
            <Text style={{ color: colors.lightText, fontSize: moderateScale(24) }}>📷</Text>
          </View>
          <Text style={[styles.placeholderText, { color: colors.placeholder }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
            Verificar Identidad
          </Text>
          
          {/* Subtítulo */}
          <Text style={[styles.subtitle, {color: colors.placeholder}]}>
            Saca o sube fotos de tu DNI para verificar{'\n'}tu identidad
          </Text>

          {/* Contenedor de imágenes */}
          <View style={styles.imagesContainer}>
            {/* Foto delantera */}
            <ImageUploadBox
              title="Foto Delantera"
              image={frontImage}
              onPress={() => pickImage('front')}
            />

            {/* Foto trasera */}
            <ImageUploadBox
              title="Foto trasera"
              image={backImage}
              onPress={() => pickImage('back')}
            />
          </View>

          {/* Botón Continuar */}
          <TouchableOpacity 
            style={[
              styles.continueButton, 
              { 
                backgroundColor: colors.primary,
                opacity: (frontImage && backImage) ? 1 : 0.6
              }
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>

          {/* Notas informativas */}
          <View style={styles.notesContainer}>
            <Text style={[styles.noteTitle, {color: colors.lightText}]}>
              Consejos para las fotos:
            </Text>
            <Text style={[styles.noteText, {color: colors.placeholder}]}>
              • Asegúrate de que el DNI esté bien iluminado
            </Text>
            <Text style={[styles.noteText, {color: colors.placeholder}]}>
              • Todos los datos deben ser legibles
            </Text>
            <Text style={[styles.noteText, {color: colors.placeholder}]}>
              • Evita reflejos o sombras
            </Text>
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
    marginBottom: verticalScale(8),
    textAlign: 'center'
  },
  subtitle: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: verticalScale(40),
    lineHeight: moderateScale(22)
  },
  imagesContainer: {
    width: '100%',
    marginBottom: verticalScale(40)
  },
  imageBox: {
    width: '100%',
    height: verticalScale(180),
    borderWidth: moderateScale(2),
    borderStyle: 'dashed',
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 51, 51, 0.3)'
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  cameraIcon: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12)
  },
  placeholderText: {
    fontSize: moderateScale(16),
    fontWeight: '500'
  },
  uploadedImage: {
    width: '95%',
    height: '95%',
    borderRadius: moderateScale(8),
    resizeMode: 'cover'
  },
  continueButton: {
    width: '100%',
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(30)
  },
  continueButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  notesContainer: {
    width: '100%',
    paddingHorizontal: moderateScale(16)
  },
  noteTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(12)
  },
  noteText: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(4),
    lineHeight: moderateScale(20)
  }
});

export default VerificarIdentidad;