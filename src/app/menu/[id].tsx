// src/app/menu/[id].tsx
import { TMDB_API_KEY } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const REVIEWS_KEY = '@reviews_peliculas';
const COMPRAS_KEY = 'compras_usuario';

type Pelicula = {
  id: number;
  poster_path: string;
  title: string;
  release_date: string;
  runtime: number;
  vote_average: number;
  overview: string;
};

type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

type Review = {
  movieId: string;
  movieTitle: string;
  rating: number;
  body: string;
  createdAt: string;
};

type CompraGuardada = {
  tipo: string;
  pelicula: string;
  fecha: string | string[];
  hora: string | string[];
  movieId?: string | null;
};

const PeliculaSeleccionada = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const movieId = Array.isArray(id) ? id[0] : id;

  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasReview, setHasReview] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!movieId) return;

      try {
        setLoading(true);

        const [res1, res2] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/movie/${movieId}?language=es-AR&api_key=${TMDB_API_KEY}`
          ),
          fetch(
            `https://api.themoviedb.org/3/movie/${movieId}/credits?language=es-AR&api_key=${TMDB_API_KEY}`
          ),
        ]);

        const dataPeli = await res1.json();
        const dataCast = await res2.json();

        setPelicula(dataPeli);
        setCast((dataCast.cast || []).slice(0, 6));
      } catch (error) {
        console.error('Error cargando película:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

  // Cargar reviews + comprobar si el usuario puede dejar review
  useEffect(() => {
    const loadReviewsAndRights = async () => {
      if (!movieId) return;

      try {
        // 1) Reviews
        const raw = await AsyncStorage.getItem(REVIEWS_KEY);
        const allReviews: Review[] = raw ? JSON.parse(raw) : [];
        const movieReviews = allReviews.filter(
          (r) => r.movieId === movieId.toString()
        );
        setReviews(movieReviews);
        setHasReview(movieReviews.length > 0);

        // 2) Compras (para saber si vio la peli)
        const comprasRaw = await AsyncStorage.getItem(COMPRAS_KEY);
        const compras: CompraGuardada[] = comprasRaw
          ? JSON.parse(comprasRaw)
          : [];

        const ahora = new Date().getTime();
        const haVisto = compras.some((c) => {
          if (c.tipo !== 'Entrada de cine') return false;

          // Comparamos por movieId si existe, si no por título
          const coincideMovieId =
            c.movieId && c.movieId.toString() === movieId.toString();
          const coincideTitulo =
            pelicula && c.pelicula === pelicula.title;

          if (!coincideMovieId && !coincideTitulo) return false;

          // Si no tenemos fecha/hora, igual lo consideramos válido
          if (!c.fecha || !c.hora) return true;

          const fechaStr = Array.isArray(c.fecha) ? c.fecha[0] : c.fecha;
          const horaStr = Array.isArray(c.hora) ? c.hora[0] : c.hora;

          // Esperamos formato 'YYYY-MM-DD' y 'HH:mm'
          const [y, m, d] = fechaStr.split('-').map(Number);
          const [hh, mm] = horaStr.split(':').map(Number);

          if (!y || !m || !d || isNaN(hh) || isNaN(mm)) return true; // no rompemos

          const fechaHora = new Date(y, m - 1, d, hh, mm).getTime();
          return fechaHora <= ahora;
        });

        setCanReview(haVisto);
      } catch (e) {
        console.error('Error cargando reviews/compras:', e);
        setCanReview(false);
      }
    };

    loadReviewsAndRights();
  }, [movieId, pelicula]);

  const esProximamente = (() => {
    if (!pelicula?.release_date) return false;
    const hoy = new Date();
    const estreno = new Date(pelicula.release_date);
    return estreno > hoy;
  })();

  const handleReviewPress = () => {
    if (!movieId || !pelicula) return;

    router.push({
      pathname: '/menu/reviews/escribir',
      params: {
        movieId: movieId.toString(),
        title: pelicula.title,
      },
    });
  };

  if (loading || !pelicula) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ff2b2b" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Botón back */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Poster y datos principales */}
      <View style={styles.header}>
        <Image
          source={{
            uri: `https://image.tmdb.org/t/p/w500${pelicula.poster_path}`,
          }}
          style={styles.poster}
        />
        <Text style={styles.title}>{pelicula.title}</Text>

        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Ionicons name="calendar-outline" size={16} color="white" />
            <Text style={styles.chipText}>
              {pelicula.release_date?.slice(0, 4) || 'Fecha N/D'}
            </Text>
          </View>
          {pelicula.runtime ? (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={16} color="white" />
              <Text style={styles.chipText}>{pelicula.runtime} min</Text>
            </View>
          ) : null}
          <View style={styles.chip}>
            <Ionicons name="star" size={16} color="#ffd700" />
            <Text style={styles.chipText}>
              {pelicula.vote_average?.toFixed(1) || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Botón Comprar / Review */}
      {!esProximamente && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => router.push(`/menu/compra/${movieId}`)}
          >
            <Text style={styles.buyButtonText}>Comprar tickets</Text>
          </TouchableOpacity>

          {canReview && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={handleReviewPress}
            >
              <Text style={styles.reviewButtonText}>
                {hasReview ? 'Editar review' : 'Dejar review'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() =>
              router.push(`/menu/reviews/${movieId}`)
            }
          >
            <Text style={styles.reviewButtonText}>Ver reviews</Text>
          </TouchableOpacity>
        </View>
      )}

      {!canReview && !esProximamente && (
        <Text style={styles.reviewHint}>
          Podrás dejar una review cuando hayas visto esta película (y tengas una
          entrada registrada).
        </Text>
      )}

      {/* Sinopsis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sinopsis</Text>
        <Text style={styles.sectionText}>{pelicula.overview}</Text>
      </View>

      {/* Reparto */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reparto principal</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cast.map((actor) => (
            <View key={actor.id} style={styles.actorCard}>
              {actor.profile_path ? (
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w200${actor.profile_path}`,
                  }}
                  style={styles.actorImage}
                />
              ) : (
                <View style={styles.actorPlaceholder}>
                  <Ionicons name="person" size={24} color="#999" />
                </View>
              )}
              <Text style={styles.actorName}>{actor.name}</Text>
              <Text style={styles.actorCharacter}>{actor.character}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loader: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: { position: 'absolute', top: 40, left: 10, zIndex: 10, padding: 8 },
  header: {
    paddingTop: 70,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  poster: {
    width: 260,
    height: 380,
    borderRadius: 12,
    backgroundColor: '#444',
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#222',
    gap: 4,
  },
  chipText: { color: 'white', fontSize: 12 },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    justifyContent: 'center',
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#ff2b2b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  reviewButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  reviewButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  reviewHint: {
    color: '#aaa',
    fontSize: 13,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  sectionText: { color: '#ddd', fontSize: 14 },
  actorCard: {
    width: 100,
    marginRight: 10,
    alignItems: 'center',
  },
  actorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 6,
  },
  actorPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actorName: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  actorCharacter: {
    color: '#aaa',
    fontSize: 11,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: { color: '#999', fontSize: 11 },
  reviewBody: { color: 'white', fontSize: 14, marginTop: 6 },
});

export default PeliculaSeleccionada;