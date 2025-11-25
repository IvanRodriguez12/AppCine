import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="inicio" />
      <Stack.Screen name="iniciarSesion" />
      <Stack.Screen name="crearCuenta" />
      <Stack.Screen name="ingresarCorreo" />
      <Stack.Screen name="verificarCorreo" />
      <Stack.Screen name="verificarEmail" /> {/* ⬅️ NUEVO */}
      <Stack.Screen name="reestablecerContrasena" />
      <Stack.Screen name="verificarIdentidad" />
      <Stack.Screen name="Scan" />
      <Stack.Screen name="mensajeBienvenida" />
    </Stack>
  );
}