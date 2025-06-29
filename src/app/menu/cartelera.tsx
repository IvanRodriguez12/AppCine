import Header from '@/components/Header';
import { TMDB_API_KEY } from '@env';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface Pelicula {
  id: number;
  title: string;
  vote_average: number;
  poster_path: string | null;
}

const CarteleraPage: React.FC = () => {
  const router = useRouter();
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modo, setModo] = useState<'now_playing' | 'upcoming'>('now_playing');

  useEffect(() => {
    fetchPeliculas();
  }, [modo]);

  const fetchPeliculas = async () => {
    setCargando(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${modo}?language=es-AR&page=1&api_key=${TMDB_API_KEY}`
      );
      const data = await response.json();
      if (data.results) {
        
      const hoy = new Date();
      const filtradas = data.results.filter((pelicula: any) => {
        const estreno = new Date(pelicula.release_date);
        return modo === 'now_playing'
          ? estreno <= hoy
          : estreno > hoy;
      });
      setPeliculas(filtradas);
    
      } else {
        console.warn('No se encontraron resultados:', data);
      }
    } catch (error) {
      console.error('Error al obtener películas:', error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="CineApp"
        onBack={() => {
          router.back();
        }}
      />

      <View style={styles.navButtons}>
        <TouchableOpacity
          style={modo === 'now_playing' ? styles.activeNavButton : styles.inactiveNavButton}
          onPress={() => setModo('now_playing')}
        >
          <Text style={modo === 'now_playing' ? styles.activeNavText : styles.inactiveNavText}>Estrenos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={modo === 'upcoming' ? styles.activeNavButton : styles.inactiveNavButton}
          onPress={() => setModo('upcoming')}
        >
          <Text style={modo === 'upcoming' ? styles.activeNavText : styles.inactiveNavText}>Próximamente</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#ff4081" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.grid}>
            {peliculas.map((pelicula) => (
              <TouchableOpacity key={pelicula.id} style={styles.card} onPress={() => router.push(`/menu/${pelicula.id}`)}>
                <View style={styles.imageWrapper}>
                  {typeof pelicula.poster_path === 'string' && pelicula.poster_path.trim() !== '' ? (
                    <Image
                      source={{ uri: `${TMDB_IMAGE_BASE}${pelicula.poster_path}` }}
                      style={styles.poster}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.poster, styles.placeholder]}>
                      <Text style={{ color: '#fff' }}>Sin imagen</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.nombre} numberOfLines={2}>{pelicula.title}</Text>
                <Text style={styles.puntaje}>⭐ {pelicula.vote_average.toFixed(1)}/10</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: moderateScale(10),
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  activeNavButton: {
    backgroundColor: 'red',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20
  },
  activeNavText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  inactiveNavButton: {
    backgroundColor: '#4a4a4a',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20
  },
  inactiveNavText: {
    color: '#fff'
  },
  scrollContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: cardWidth,
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden'
  },
  imageWrapper: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden'
  },
  poster: {
    width: '100%',
    height: 220
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#444'
  },
  nombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 10,
    paddingTop: 8
  },
  puntaje: {
    fontSize: 13,
    color: '#bbb',
    paddingHorizontal: 10,
    paddingBottom: 12
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f'
  }
});

export default CarteleraPage;