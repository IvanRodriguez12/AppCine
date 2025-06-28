import { TMDB_API_KEY } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const dias = ['Lun. 18', 'Mart. 19', 'Miérc. 21', 'Juev. 22', 'Vier. 23'];
const horarios = ['15:30', '16:30', '17:30', '18:30', '19:30'];

type Pelicula = {
  poster_path: string;
  title: string;
};

const CompraTicket = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [diaSeleccionado, setDiaSeleccionado] = useState(2);
  const [horaSeleccionada, setHoraSeleccionada] = useState(2);
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchPelicula = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?language=es-AR&api_key=${TMDB_API_KEY}`
        );
        const data = await res.json();
        setPelicula(data);
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };

    if (id) fetchPelicula();
  }, [id]);

  if (cargando || !pelicula) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ff2b2b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      <View style={styles.header}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${pelicula.poster_path}` }}
          style={styles.poster}
        />
        <Text style={styles.title}>{pelicula.title}</Text>
      </View>

      <View style={styles.selectionArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
          {dias.map((dia, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.option, index === diaSeleccionado && styles.selected]}
              onPress={() => setDiaSeleccionado(index)}
            >
              <Text style={styles.optionText}>{dia}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
          {horarios.map((hora, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.option, index === horaSeleccionada && styles.selected]}
              onPress={() => setHoraSeleccionada(index)}
            >
              <Text style={styles.optionText}>{hora}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push(`/asientos/${id}`)}
        >
          <Text style={styles.buttonText}>Seleccionar asientos</Text>
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    backgroundColor: '#2a2a2a',
    height: '52%',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  poster: {
    width: 280,
    height: 400,
    borderRadius: 12,
    backgroundColor: '#444',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 8,
  },
  selectionArea: {
    flex: 1,
    paddingTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    marginBottom: 0,
  },
  option: {
    backgroundColor: '#771111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'center',
    minWidth: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  selected: {
    backgroundColor: '#ff2b2b',
  },
  optionText: {
    color: 'white',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#ff2b2b',
    marginBottom: 100,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 0,
    alignSelf: 'stretch',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 8,
  },
});

export default CompraTicket;