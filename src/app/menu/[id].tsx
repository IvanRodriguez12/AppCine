import Header from '@/components/Header';
import { TMDB_API_KEY } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Genre {
  id: number;
  name: string;
}

interface Pelicula {
  title: string;
  release_date: string;
  runtime: number;
  genres: Genre[];
  overview: string;
  poster_path: string;
}

interface CastMember {
  id: number;
  name: string;
  profile_path?: string;
}

const PeliculaSeleccionada = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorito, setFavorito] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/${id}?language=es-AR&api_key=${TMDB_API_KEY}`),
          fetch(`https://api.themoviedb.org/3/movie/${id}/credits?language=es-AR&api_key=${TMDB_API_KEY}`)
        ]);
        const data1 = await res1.json();
        const data2 = await res2.json();
        setPelicula(data1);
        setCast(data2.cast?.slice(0, 6) || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  const hoy = new Date();
  const estreno = pelicula ? new Date(pelicula.release_date) : hoy;
  const esProximamente = estreno > hoy;

  if (loading || !pelicula) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ff4081" />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <Header
        title="CineApp"
        onBack={() => {
          router.back();
        }}
      />

      <ScrollView style={styles.container}>
        <View style={styles.posterWrapper}>
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w500${pelicula.poster_path}` }}
            style={styles.poster}
          />

          <TouchableOpacity
            style={styles.favoriteIcon}
            onPress={() => setFavorito(!favorito)}
          >
            <Ionicons
              name={favorito ? "heart" : "heart-outline"}
              size={28}
              color={favorito ? "red" : "white"}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          {pelicula.title} ★★★★★
        </Text>

        <Text style={styles.info}>
          {pelicula.release_date?.split('-')[0]} | {pelicula.runtime} min | {pelicula.genres.map(g => g.name).join(', ')}
        </Text>

        <Text style={styles.subtitle}>Sinopsis</Text>
        <Text style={styles.description}>{pelicula.overview}</Text>

        <Text style={styles.subtitle}>Reparto</Text>
        <Text style={styles.description}>
          {cast.map(actor => actor.name).join(', ')}
        </Text>
      
        {!esProximamente && (
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => router.push(`/menu/compra/${id}`)}
        >
          <Text style={styles.buyButtonText}>Comprar Tickets</Text>
        </TouchableOpacity>
      )}
      </ScrollView>
    
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  container: {
    paddingHorizontal: 16,
    backgroundColor: 'black',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  posterWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
  poster: {
    width: 200,
    height: 300,
    borderRadius: 12,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  info: {
    color: 'gray',
    marginVertical: 6,
  },
  subtitle: {
    marginTop: 12,
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
  },
  description: {
    color: 'white',
    marginBottom: 12,
  },
  buyButton: {
    backgroundColor: '#ff4081',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  buyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PeliculaSeleccionada;