import Header from '@/components/Header';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const MisEntradasDetalle = () => {
  const { entrada } = useLocalSearchParams();
  const router = useRouter();

  const data = entrada ? JSON.parse(entrada as string) : null;

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: 'white' }}>Error al mostrar el ticket</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Detalle de entrada" />

      {/* BOTÓN VOLVER */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={26} color="white" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>{data.pelicula}</Text>

        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={20} color="white" />
          <Text style={styles.info}>{data.fecha} • {data.hora}</Text>
        </View>

        <View style={styles.row}>
          <MaterialCommunityIcons name="seat-outline" size={20} color="white" />
          <Text style={styles.info}>Asientos: {data.asientos}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="card-outline" size={20} color="white" />
          <Text style={styles.info}>Total: ${data.precio}</Text>
        </View>

        {data.qrCode && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>Código QR</Text>
            {data.qrCode.startsWith('http') ? (
              <Image
                source={{ uri: data.qrCode }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrTextBox}>
                <Text style={styles.qrText}>{data.qrCode}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
        style={{
            marginTop: 24,
            backgroundColor: '#ff2b2b',
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
        }}
        onPress={() =>
            router.push({
            pathname: '/menu/reviews/escribir',
            params: {
                movieId: data.movieId ?? '',
                title: data.pelicula,
            },
            })
        }
        >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
            Dejar / editar review
        </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute',
    top: 65,
    left: 16,
    zIndex: 50,
  },
  card: {
    marginTop: 80,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  info: { color: 'white', fontSize: 16 },
  qrContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  qrLabel: {
    color: '#ccc',
    marginBottom: 6,
  },
  qrImage: {
    width: 200,
    height: 200,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  qrTextBox: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#666',
  },
  qrText: {
    color: 'white',
    fontSize: 14,
  },
});

export default MisEntradasDetalle;