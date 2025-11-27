import { TMDB_API_KEY } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/context/authContext';
import reviewsApi, { ReviewDto } from '@/services/reviewsApi';

const REVIEWS_TITLE_FALLBACK = 'Película';

type CompraGuardada = {
  tipo: string;
  pelicula: string;
  fecha?: string | string[];
  hora?: string | string[];
  movieId?: string | null;
};

const ReviewsListPorPelicula: React.FC = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const movieId = id ? Number(Array.isArray(id) ? id[0] : id) : null;
  const movieIdStr = movieId ? movieId.toString() : null;

  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [movieTitle, setMovieTitle] = useState<string>(REVIEWS_TITLE_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [hasUserReview, setHasUserReview] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const cargarFlagsReview = async (
    movieIdNum: number,
    title: string,
  ): Promise<void> => {
    try {
      // 1) ¿El usuario ya tiene review de esta peli?
      let userHasReview = false;
      if (user) {
        const userReviews = await reviewsApi.getByUser(user.uid);
        userHasReview = userReviews.some(
          (r) => r.movie_id === movieIdNum,
        );
      }
      setHasUserReview(userHasReview);

      // 2) ¿Tiene una entrada para esta peli y ya pasó la función?
      const comprasRaw = await AsyncStorage.getItem('compras_usuario');
      const compras: CompraGuardada[] = comprasRaw
        ? JSON.parse(comprasRaw)
        : [];

      const ahora = Date.now();
      const puede = compras.some((c) => {
        if (c.tipo !== 'Entrada de cine') return false;

        const coincideMovieId =
          c.movieId && movieIdStr && c.movieId.toString() === movieIdStr;
        const coincideTitulo = c.pelicula === title;

        if (!coincideMovieId && !coincideTitulo) return false;

        if (!c.fecha || !c.hora) return true; // sin fecha/hora: lo tomamos como visto

        const fechaStr = Array.isArray(c.fecha) ? c.fecha[0] : c.fecha;
        const horaStr = Array.isArray(c.hora) ? c.hora[0] : c.hora;

        if (!fechaStr || !horaStr) return true;

        const [y, m, d] = fechaStr.split('-').map(Number);
        const [hh, mm] = horaStr.split(':').map(Number);

        if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
          return true;
        }

        const ts = new Date(y, m - 1, d, hh, mm).getTime();
        return ts <= ahora;
      });

      setCanReview(puede);
    } catch (e) {
      console.error('Error cargando flags de review:', e);
      setHasUserReview(false);
      setCanReview(false);
    }
  };

  const cargarDatos = async () => {
    if (!movieId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1) Datos de la película
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?language=es-AR&api_key=${TMDB_API_KEY}`,
      );
      const data = await res.json();
      const title = data?.title || REVIEWS_TITLE_FALLBACK;
      setMovieTitle(title);

      // 2) Reviews de la película
      const revs = await reviewsApi.getByMovie(movieId);
      setReviews(revs);

      // 3) Flags de review (tiene review y puede dejar review)
      await cargarFlagsReview(movieId, title);
    } catch (e) {
      console.error('Error cargando reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, user]);

  const handleBack = () => {
    router.back();
  };

  const handleEscribirReview = () => {
    if (!movieId) return;
    router.push({
      pathname: '/menu/reviews/escribir',
      params: {
        movieId: movieId.toString(),
        title: movieTitle,
      },
    });
  };

  const esMiReview = (review: ReviewDto) =>
    user && review.user_id === user.uid;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#ff2b2b" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Botón atrás */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={26} color="white" />
      </TouchableOpacity>

      <View style={{ marginTop: 70, paddingHorizontal: 16, flex: 1 }}>
        {/* Título */}
        <Text style={styles.movieTitle}>{movieTitle}</Text>

        {/* Botón escribir / editar review o mensaje de restricción */}
        {canReview ? (
          <TouchableOpacity
            style={styles.writeButton}
            onPress={handleEscribirReview}
          >
            <Text style={styles.writeButtonText}>
              {hasUserReview ? 'Editar mi review' : 'Escribir review'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.restrictionText}>
            Solo podés escribir una review si ya viste esta película y tenés una
            entrada registrada cuyo horario ya haya pasado.
          </Text>
        )}

        {/* Lista de reviews */}
        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay reviews para esta película todavía.
          </Text>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {reviews.map((r: ReviewDto, idx: number) => (
              <View key={idx} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= r.rating ? 'star' : 'star-outline'}
                        size={18}
                        color="#ffd700"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.author}>
                  Por: {esMiReview(r) ? 'Vos' : r.user_id}
                </Text>
                <Text style={styles.reviewBody}>
                  {r.comment || '(Sin comentario)'}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  backButton: { position: 'absolute', top: 65, left: 16, zIndex: 50 },
  movieTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  writeButton: {
    backgroundColor: '#ff2b2b',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  writeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  restrictionText: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
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
  author: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  reviewBody: { color: 'white', fontSize: 14, marginTop: 2 },
});

export default ReviewsListPorPelicula;