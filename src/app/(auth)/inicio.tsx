import imagePath from '@/constants/imagePath';
import { router } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const Inicio = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={imagePath.logo} style={styles.imageStyle} resizeMode="contain" />
        <Text style={styles.cineAppText}>CineApp</Text>
        <Text style={styles.subtitleText}>Tu experiencia de cine definitiva</Text> 
      </View>

      {/* Body con los botones */}
      <View style={styles.body}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push("/(auth)/iniciarSesion")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push("/(auth)/crearCuenta")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Crear Cuenta</Text>
        </TouchableOpacity>
      </View>

      {/* Footer con derechos reservados */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>©2025 CineApp - Todos los derechos reservados</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 0.7,
    paddingBottom: verticalScale(15), 
    marginTop: verticalScale(-30), 
  },
  body: {
    alignItems: "center",
    gap: verticalScale(20), 
    marginTop: verticalScale(10), 
  },
  footer: {
    alignItems: "center",
    paddingBottom: verticalScale(10),
    marginBottom: verticalScale(70), 
  },
  imageStyle: {
    height: 100,
    width: 100,
  },
  cineAppText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  subtitleText: {
    fontSize: 16,
    color: "white",
  },
  button: {
    backgroundColor: "#ff0000",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerText: {
    fontSize: moderateScale(12),
    color: "#867373",
  },
});

export default Inicio;