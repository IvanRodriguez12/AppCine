import Header from '@/components/Header';
import cuponesData from '@/data/cupones.json';
import { getIcono } from '@/utils/getIcono';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const CuponDetalle = () => {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const router = useRouter();

  const cupon = cuponesData.cupones.find(c => c.codigo === codigo);

  if (!cupon) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Cupón no encontrado</Text>
      </View>
    );
  }

  const handleUsarCupon = () => {
    if (cupon.objeto === 'ticket') {
      router.push('/menu/cartelera');
    } else {
      router.push('/menu/CandyShop');
    }
  };

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <Header title="CineApp" onBack={() => router.back()} />
        <View style={styles.background}>
          <View style={styles.card}>
            <View style={styles.cabecera}>
              <Image source={getIcono(cupon.icono)} style={styles.icono} />
              <View>
                <Text style={styles.titulo}>{cupon.titulo}</Text>
                <Text style={styles.subtitulo}>{cupon.descripcion}</Text>
              </View>
            </View>

            <View style={styles.descripcionArea}>
              <Text style={styles.descripcionGruesa}>
                {cupon.tipo === 'porcentaje'
                  ? `${cupon.descuento}% de descuento en ${cupon.objeto === 'ticket' ? 'entradas' : 'cualquier combo'}`
                  : cupon.tipo === 'fijo'
                  ? `$${cupon.descuento} de descuento`
                  : 'Promoción 2x1 en entradas'}
              </Text>
              <Text style={styles.puntos}>• Canjeable en cualquiera de nuestros cines</Text>
              <Text style={styles.puntos}>• No válido con otras promociones</Text>
              <Text style={styles.puntos}>• Sin valor en efectivo</Text>
            </View>

            <View style={styles.codigoContenedor}>
              <Text style={styles.codigoTexto}>{cupon.codigo}</Text>
            </View>

            <Text style={styles.vencimiento}>Válido hasta el {cupon.vencimiento}</Text>
          </View>

          <TouchableOpacity style={styles.botonUsar} onPress={handleUsarCupon}>
            <Text style={styles.botonTexto}>¡Utilizalo ya!</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
  );
};

export default CuponDetalle;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  background: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
    alignItems: 'center',
  },
  card: {
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  icono: {
    width: 60,
    height: 60,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitulo: {
    fontSize: 14,
    color: '#555',
  },
  descripcionArea: {
    marginVertical: 14,
    alignSelf: 'flex-start',
  },
  descripcionGruesa: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  puntos: {
    fontSize: 14,
    marginVertical: 2,
  },
  codigoContenedor: {
    marginTop: 20,
    marginBottom: 12,
    backgroundColor: '#eee',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  codigoTexto: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  vencimiento: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  botonUsar: {
    marginTop: 20,
    backgroundColor: '#FF4C4C',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  botonTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: 'red',
    fontSize: 20,
    textAlign: 'center',
  },
});