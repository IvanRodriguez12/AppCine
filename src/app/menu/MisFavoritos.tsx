import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TMDB_API_KEY } from '@env';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

interface Pelicula {
  id: number;
  title: string;
  vote_average: number;
  poster_path: string;
}

const MisFavoritos = () => {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const quitarDeFavoritos = async (id: number) => {
    try {
      const favoritos = await AsyncStorage.getItem('favoritos');
      if (!favoritos) return;

      const ids: number[] = JSON.parse(favoritos);
      const nuevosFavoritos = ids.filter((favId) => favId !== id);

      await AsyncStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
      setPeliculas((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error al quitar de favoritos:', error);
    }
  };

  useEffect(() => {
    const fetchFavoritos = async () => {
      try {
        const favoritos = await AsyncStorage.getItem('favoritos');
        if (!favoritos) {
          setPeliculas([]);
          return;
        }

        const ids: number[] = JSON.parse(favoritos);
        const detalles = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(
              `https://api.themoviedb.org/3/movie/${id}?language=es-AR&api_key=${TMDB_API_KEY}`
            );
            return await res.json();
          })
        );
        setPeliculas(detalles);
      } catch (error) {
        console.error('Error al obtener favoritos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoritos();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <Header title="CineApp" onBack={() => router.back()} />
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  if (peliculas.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <Header title="CineApp" onBack={() => router.back()} />
        <Text style={styles.title}>Mis favoritos</Text>
        <Text style={styles.emptyText}>Todavía no tienes favoritos</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <Header title="CineApp" onBack={() => router.back()} />
      <Text style={styles.title}>Mis favoritos</Text>
      <ScrollView>
        {peliculas.map((peli) => (
          <TouchableOpacity
            key={peli.id}
            style={styles.card}
            onPress={() => router.push(`/menu/cartelera/${peli.id}`)}
          >
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w200${peli.poster_path}` }}
              style={styles.poster}
            />
            <View style={styles.info}>
              <Text style={styles.movieTitle}>{peli.title}</Text>
              <Text style={styles.stars}>
                {'★'.repeat(Math.round(peli.vote_average / 2))}
              </Text>
            </View>
            <TouchableOpacity onPress={() => quitarDeFavoritos(peli.id)}>
              <Ionicons name="heart" size={24} color="red" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 16,
  },
  loader: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 10,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 12,
    padding: 10,
    alignItems: 'center',
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 6,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  movieTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stars: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
  },
});

export default MisFavoritos;