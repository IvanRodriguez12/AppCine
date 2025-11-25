import { CarritoProvider } from '@/context/CarritoContext';
import { AuthProvider } from '@/context/authContext';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <Slot />
      </CarritoProvider>
    </AuthProvider>
  );
}