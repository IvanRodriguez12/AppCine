import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');

const Scan = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<CameraView>(null);

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

  useEffect(() => {
    // Los permisos ahora se manejan con el hook useCameraPermissions
  }, []);

  const handleStartScan = async () => {
    if (!permission) {
      // Si no hemos pedido permisos aún
      const newPermission = await requestPermission();
      if (!newPermission.granted) {
        Alert.alert(
          'Permisos Requeridos',
          'Necesitamos acceso a tu cámara para realizar la verificación facial',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Reintentar', onPress: handleStartScan }
          ]
        );
        return;
      }
    }

    if (!permission?.granted) {
      Alert.alert(
        'Permisos Requeridos',
        'Necesitamos acceso a tu cámara para realizar la verificación facial',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurar', onPress: async () => await requestPermission() }
        ]
      );
      return;
    }

    setShowCamera(true);
    setIsScanning(true);
    
    // Simular proceso de escaneo
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      setShowCamera(false);
      
      // Mostrar mensaje de éxito y navegar
      setTimeout(() => {
        Alert.alert(
          'Verificación Exitosa',
          'Tu identidad ha sido verificada correctamente',
          [
            {
              text: 'Continuar',
              onPress: () => router.replace('./mensajeBienvenida')
            }
          ]
        );
      }, 500);
    }, 3000);
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBg }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.loadingText, { color: colors.lightText }]}>
            Cargando permisos de cámara...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showCamera && permission?.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBg }]}>
        <CameraView
          style={styles.camera}
          facing="front"
          ref={cameraRef}
        >
          <View style={styles.cameraOverlay}>
            {/* Header */}
            <View style={styles.header}>
              <Image 
                source={require('../../assets/images/icon.png')} 
                style={styles.headerLogo}
              />
              <Text style={[styles.headerTitle, { color: colors.lightText }]}>
                Scan Facial
              </Text>
            </View>

            {/* Círculo de escaneo */}
            <View style={styles.scanArea}>
              <View style={[styles.scanCircle, { borderColor: isScanning ? colors.primary : colors.divider }]}>
                {isScanning && (
                  <View style={[styles.scanningIndicator, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={[styles.instructionText, { color: colors.lightText }]}>
                Coloca tu rostro{'\n'}dentro del círculo
              </Text>
            </View>

            {/* Indicador de progreso */}
            {isScanning && (
              <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: colors.lightText }]}>
                  Verificación facial...
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.divider }]}>
                  <View style={[styles.progressFill, { backgroundColor: colors.primary }]} />
                </View>
              </View>
            )}

            {/* Botón cancelar */}
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.socialButtonBg }]}
              onPress={handleGoBack}
            >
              <Text style={[styles.cancelButtonText, { color: colors.lightText }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBg }]}>
      <View style={styles.content}>
        {/* Header con logo */}
        <View style={styles.headerContainer}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={styles.logo}
          />
          <Text style={[styles.title, { color: colors.lightText }]}>
            Scan Facial
          </Text>
        </View>

        {/* Área de instrucciones */}
        <View style={styles.instructionsContainer}>
          <View style={[styles.scanPreview, { borderColor: colors.divider }]}>
            <View style={[styles.faceOutline, { borderColor: colors.placeholder }]}>
              <Text style={[styles.faceText, { color: colors.placeholder }]}>
                👤
              </Text>
            </View>
          </View>
          
          <Text style={[styles.instructionTitle, { color: colors.lightText }]}>
            Verificación de Identidad
          </Text>
          <Text style={[styles.instructionSubtitle, { color: colors.placeholder }]}>
            Usaremos tu cámara frontal para verificar tu identidad de forma segura
          </Text>
        </View>

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.scanButton, { backgroundColor: colors.primary }]}
            onPress={handleStartScan}
          >
            <Text style={styles.scanButtonText}>Iniciar scan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Text style={[styles.backButtonText, { color: colors.primary }]}>
              Volver
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, { color: colors.placeholder }]}>
            Verificación facial
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
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(40),
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
    resizeMode: 'contain',
    marginBottom: verticalScale(16),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanPreview: {
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: moderateScale(100),
    borderWidth: moderateScale(2),
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(32),
  },
  faceOutline: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: moderateScale(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceText: {
    fontSize: moderateScale(40),
  },
  instructionTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  instructionSubtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
    paddingHorizontal: moderateScale(20),
  },
  buttonContainer: {
    marginTop: verticalScale(32),
  },
  scanButton: {
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  scanButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    alignItems: 'center',
    padding: verticalScale(8),
  },
  backButtonText: {
    fontSize: moderateScale(16),
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: verticalScale(20),
  },
  footerText: {
    fontSize: moderateScale(12),
  },
  
  // Estilos para la cámara
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: moderateScale(24),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  headerLogo: {
    width: moderateScale(50),
    height: moderateScale(50),
    resizeMode: 'contain',
    marginBottom: verticalScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCircle: {
    width: moderateScale(250),
    height: moderateScale(250),
    borderRadius: moderateScale(125),
    borderWidth: moderateScale(3),
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(24),
  },
  scanningIndicator: {
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: moderateScale(100),
    opacity: 0.3,
  },
  instructionText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
  },
  progressText: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(8),
  },
  progressBar: {
    width: moderateScale(200),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '60%',
    borderRadius: moderateScale(2),
  },
  cancelButton: {
    borderRadius: moderateScale(8),
    padding: verticalScale(12),
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: moderateScale(32),
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
});

export default Scan;