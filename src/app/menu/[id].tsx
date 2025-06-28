import Header from '@/components/Header';
import { TMDB_API_KEY } from '@env';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
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

  if (loading || !pelicula) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ff4081" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Header
        title="CineApp"
        onBack={() => {
          router.back();
        }}
      />

      <View style={styles.posterWrapper}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${pelicula.poster_path}` }}
          style={styles.poster}
        />
      </View>

      <Text style={styles.title}>{pelicula.title} ★★★★★</Text>
      <Text style={styles.subinfo}>
        {pelicula.release_date?.split('-')[0]} | {pelicula.runtime} min | {pelicula.genres.map(g => g.name).join(', ')}
      </Text>

      <Text style={styles.sectionTitle}>Sinopsis</Text>
      <Text style={styles.description}>{pelicula.overview}</Text>

      <Text style={styles.sectionTitle}>Reparto</Text>
      <Text style={styles.description}>
        {cast.map(actor => actor.name).join(', ')}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingTop: 40
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between'
  },
  back: {
    fontSize: 24,
    color: '#fff'
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  logo: {
    width: 28,
    height: 28
  },
  posterWrapper: {
    alignItems: 'center',
    marginVertical: 12
  },
  poster: {
    width: 250,
    height: 360,
    borderRadius: 12
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8
  },
  subinfo: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16
  },
  description: {
    fontSize: 14,
    color: '#ddd',
    marginTop: 6
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  }
});

export default PeliculaSeleccionada;