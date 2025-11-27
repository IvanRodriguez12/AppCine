import app from '@/app/config/firebase';
import Header from '@/components/Header';
import { getIcono } from '@/utils/getIcono';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { collection, getDocs, getFirestore, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const db = getFirestore(app);

interface Cupon {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  vencimiento: string;
  icono: string;
  premiumOnly: boolean;
}

const getDescripcionDesdeModelo = (data: any): string => {
  const scopeText =
    data.scope === 'tickets'
      ? 'en tickets'
      : data.scope === 'candyshop'
      ? 'en la candy shop'
      : 'en tickets y candy shop';

  let base = '';

  switch (data.mode) {
    case 'fixed':
      base = `Descuento de $${data.value ?? 0}`;
      break;
    case 'percent':
      base = `Descuento de ${data.value ?? 0}%`;
      break;
    case '2x1':
    case '3x2': {
      const buy = data.buyQuantity ?? (data.mode === '2x1' ? 2 : 3);
      const pay = data.payQuantity ?? (data.mode === '2x1' ? 1 : 2);
      base = `${buy}x${pay}`;
      break;
    }
    default:
      base = 'Beneficio especial';
  }

  return `${base} ${scopeText}${data.premiumOnly ? ' (Premium)' : ''}`;
};

const getIconoPorScope = (scope: string): string => {
  switch (scope) {
    case 'tickets':
      return 'ticket.png';
    case 'candyshop':
      return 'popcorn.png';
    case 'both':
    default:
      return 'combo.png';
  }
};

const Cupones = () => {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [suscripto, setSuscripto] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        // 1) Leer si el usuario es premium desde AsyncStorage
        const sub = await AsyncStorage.getItem('estadoSuscripcion');
        const esPremium = sub ? JSON.parse(sub).suscripto : false;
        setSuscripto(esPremium);

        // 2) Leer cupones desde Firestore
        const snapshot = await getDocs(collection(db, 'coupons'));
        const ahora = new Date();

        const todos: Cupon[] = [];

        snapshot.forEach(doc => {
          const data = doc.data() as any;

          // Sólo cupones activos
          const activo = data.active !== false;

          // Manejo de fecha de vencimiento
          const validTo = data.validTo as Timestamp | undefined;
          let vencimientoTexto = 'Sin fecha de vencimiento';
          let expirado = false;

          if (validTo && typeof validTo.toDate === 'function') {
            const fecha = validTo.toDate();
            vencimientoTexto = fecha.toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            expirado = fecha < ahora;
          }

          if (!activo || expirado) {
            // no lo mostramos
            return;
          }

          const cupon: Cupon = {
            id: doc.id,
            codigo: data.code,
            titulo: `Cupón ${data.code}${data.premiumOnly ? ' · Premium' : ''}`,
            descripcion: getDescripcionDesdeModelo(data),
            vencimiento: vencimientoTexto,
            icono: getIconoPorScope(data.scope),
            premiumOnly: !!data.premiumOnly,
          };

          todos.push(cupon);
        });

        // 3) Filtrar según si el usuario es premium o no
        const filtrados = todos.filter(c => !c.premiumOnly || esPremium);

        setCupones(filtrados);
      } catch (error) {
        console.error('Error cargando cupones desde Firestore:', error);
        setCupones([]); // evitamos dejar el estado en null
      }
    };

    cargar();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <Header title="CineApp" onBack={() => router.back()} />
      <ScrollView style={styles.container}>
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
    </SafeAreaView>
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