import Header from '@/components/Header';
import cuponesData from '@/data/cupones.json';
import { getIcono } from '@/utils/getIcono';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Cupon {
  codigo: string;
  titulo: string;
  descripcion: string;
  objeto: string;
  tipo: string;
  descuento: number | null;
  vencimiento: string;
  icono: string;
  premium?: boolean;
}

const Cupones = () => {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [suscripto, setSuscripto] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const sub = await AsyncStorage.getItem('estadoSuscripcion');
      const esPremium = sub ? JSON.parse(sub).suscripto : false;
      setSuscripto(esPremium);
      const filtrados = cuponesData.cupones.filter(c => !c.premium || esPremium);
      setCupones(filtrados);
    };
    cargar();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Header title="Cupones" onBack={() => router.back()} />
      <Text style={styles.titulo}>Cupones</Text>
      {cupones.length === 0 ? (
        <Text style={styles.sinCupones}>No tenés cupones disponibles por el momento.</Text>
      ) : cupones.map((c, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => router.push(`/menu/cupones/${c.codigo}`)}
          style={styles.cupon}
        >
          <Image source={getIcono(c.icono)} style={styles.icono} resizeMode="contain" />
          <View style={styles.textoContainer}>
            <Text style={styles.tituloCupon}>{c.titulo}</Text>
            <Text>{c.descripcion}</Text>
            <Text style={styles.vencimiento}>Válido hasta el {c.vencimiento}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default Cupones;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
  },
  titulo: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginVertical: 16,
    alignSelf: 'center',
  },
  sinCupones: {
    color: 'gray',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  cupon: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 10,
  },
  icono: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  textoContainer: {
    flex: 1,
  },
  tituloCupon: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  vencimiento: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
});