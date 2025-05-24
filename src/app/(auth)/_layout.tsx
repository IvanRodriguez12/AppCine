import { Stack } from 'expo-router';
import React from 'react';

const AuthStack = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="inicio" />
      <Stack.Screen name="iniciarSesion" />
      <Stack.Screen name="crearCuenta" />
    </Stack>
  );
};

export default AuthStack;