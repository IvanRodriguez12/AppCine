import { CarritoProvider } from '@/context/CarritoContext';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <CarritoProvider>
      <Slot />
    </CarritoProvider>
  );
}
