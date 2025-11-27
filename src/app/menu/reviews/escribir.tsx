// src/app/menu/reviews/escribir.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Header from '@/components/Header';
import { useAuth } from '@/context/authContext';
import reviewsApi from '@/services/reviewsApi';

const EscribirReview: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    movieId?: string;
    title?: string;
  }>();

  const movieIdNumber = params.movieId ? Number(params.movieId) : null;
  const movieTitle = params.title || 'Película';

  const [contenido, setContenido] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = reviewId !== null;

  useEffect(() => {
    const cargarReviewExistente = async () => {
      if (!user || !movieIdNumber) return;
      try {
        const userReviews = await reviewsApi.getByUser(user.uid);
        const existente = userReviews.find(
          (r) => r.movie_id === movieIdNumber,
        );
        if (existente) {
          setReviewId(existente.id);
          setRating(existente.rating);
          setContenido(existente.comment || '');
        }
      } catch (e) {
        console.error('Error cargando review existente:', e);
      }
    };
    cargarReviewExistente();
  }, [user, movieIdNumber]);

  const sendReview = async () => {
    if (!user) {
      Alert.alert(
        'Iniciar sesión',
        'Debes iniciar sesión para dejar una review.',
      );
      return;
    }

    if (!movieIdNumber) {
      Alert.alert('Error', 'No se pudo identificar la película.');
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert(
        'Revisión',
        'Seleccioná una puntuación entre 1 y 5 estrellas.',
      );
      return;
    }

    if (!contenido.trim()) {
      Alert.alert('Revisión', 'No podés dejar la review vacía.');
      return;
    }

    setLoading(true);
    try {
      if (reviewId) {
        await reviewsApi.update(reviewId, {
          rating,
          comment: contenido.trim(),
        });
      } else {
        await reviewsApi.create({
          user_id: user.uid,
          movie_id: movieIdNumber,
          rating,
          comment: contenido.trim(),
        });
      }

      Alert.alert('Listo', 'Tu review se guardó correctamente.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (e) {
      console.error('Error guardando review:', e);
      Alert.alert('Error', 'No se pudo guardar la review. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star: number) => (
        <TouchableOpacity
          key={star}
          style={styles.starButton}
          onPress={() => setRating(star)}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={26}
            color={star <= rating ? '#FFD700' : '#666'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header general del cine */}
      <Header title={isEditing ? 'Editar review' : 'Dejar review'} />

      {/* Botón atrás flotante */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={26} color="white" />
      </TouchableOpacity>

      <View style={styles.formContainer}>
        <Text style={styles.movieTitle}>{movieTitle}</Text>

        <Text style={styles.label}>Puntuación</Text>
        {renderStars()}

        <Text style={styles.label}>Contenido de la review</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribí qué te pareció la película..."
          placeholderTextColor="#888"
          multiline
          value={contenido}
          onChangeText={setContenido}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={sendReview}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Guardar cambios' : 'Publicar review'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  backButton: { position: 'absolute', top: 65, left: 16, zIndex: 50 },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 80,
  },
  movieTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  starButton: {
    padding: 4,
  },
  input: {
    marginTop: 4,
    minHeight: 130,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    color: 'white',
    padding: 10,
    textAlignVertical: 'top',
    backgroundColor: '#111',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#ff2b2b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EscribirReview;