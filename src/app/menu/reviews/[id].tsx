// src/app/menu/reviews/[id].tsx
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const REVIEWS_KEY = '@reviews_peliculas';

type Review = {
  movieId: string;
  movieTitle: string;
  rating: number;
  body: string;
  createdAt: string;
};

const ReviewsListPorPelicula: React.FC = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const movieId = Array.isArray(id) ? id[0] : id;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [movieTitle, setMovieTitle] = useState<string>('Película');
  const [hasReview, setHasReview] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      if (!movieId) return;
      try {
        const raw = await AsyncStorage.getItem(REVIEWS_KEY);
        const all: Review[] = raw ? JSON.parse(raw) : [];
        const filtered = all.filter((r) => r.movieId === movieId.toString());
        setReviews(filtered);
        setHasReview(filtered.length > 0);
        if (filtered.length > 0) {
          setMovieTitle(filtered[0].movieTitle || 'Película');
        }
      } catch (e) {
        console.error('Error cargando reviews:', e);
      }
    };
    loadReviews();
  }, [movieId]);

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

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Reviews" />

      {/* Botón volver */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={26} color="white" />
      </TouchableOpacity>

      <View style={{ marginTop: 70, paddingHorizontal: 16 }}>
        <Text style={styles.movieTitle}>{movieTitle}</Text>

        {/* Botón escribir / editar review */}
        <TouchableOpacity
          style={styles.writeButton}
          onPress={handleEscribirReview}
        >
          <Text style={styles.writeButtonText}>
            {hasReview ? 'Editar mi review' : 'Escribir review'}
          </Text>
        </TouchableOpacity>

        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay reviews para esta película todavía.
          </Text>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {reviews.map((r, idx) => (
              <View key={idx} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < r.rating ? 'star' : 'star-outline'}
                        size={18}
                        color="#ffd700"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.author}>Por: Vos</Text>
                <Text style={styles.reviewBody}>{r.body}</Text>
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