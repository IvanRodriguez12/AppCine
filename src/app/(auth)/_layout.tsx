import { Stack } from 'expo-router';
import React from 'react';

const AuthStack = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="inicio" />
      <Stack.Screen name="iniciarSesion" />
      <Stack.Screen name="crearCuenta" />
      <Stack.Screen name="ingresarCorreo" />
      <Stack.Screen name="verificarCorreo" />
      <Stack.Screen name="reestablecerContrasena" />
      <Stack.Screen name="verificarIdentidad" />
      <Stack.Screen name="Scan" />
      <Stack.Screen name="mensajeBienvenida" />
      <Stack.Screen name="NovedadesAnuncios" />
    </Stack>
  );
};

export default AuthStack;