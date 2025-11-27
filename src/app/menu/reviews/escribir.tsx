// src/app/menu/reviews/escribir.tsx
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const REVIEWS_KEY = '@reviews_peliculas';

type Review = {
  movieId: string;
  movieTitle: string;
  rating: number;
  body: string;
  createdAt: string;
};

const EscribirReview: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Aceptamos tanto movieId como id (por si en algún lugar lo pasan distinto)
  const rawMovieId = (params.movieId ?? params.id) as string | string[] | undefined;
  const rawTitle = params.title as string | string[] | undefined;

  const movieIdStr = Array.isArray(rawMovieId) ? rawMovieId[0] : rawMovieId;
  const movieTitle = Array.isArray(rawTitle) ? rawTitle[0] : rawTitle;

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadExistingReview = async () => {
      if (!movieIdStr) return;
      try {
        const raw = await AsyncStorage.getItem(REVIEWS_KEY);
        const all: Review[] = raw ? JSON.parse(raw) : [];
        const existing = all.find((r) => r.movieId === movieIdStr);
        if (existing) {
          setRating(existing.rating);
          setBody(existing.body);
          setIsEditing(true);
        }
      } catch (e) {
        console.error('Error cargando review existente:', e);
      }
    };
    loadExistingReview();
  }, [movieIdStr]);

  const handleSave = async () => {
    if (!movieIdStr) {
      Alert.alert('Error', 'No se pudo identificar la película.');
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert('Revisión', 'Debes seleccionar una puntuación entre 1 y 5 estrellas.');
      return;
    }

    if (!body.trim()) {
      Alert.alert('Revisión', 'No podés dejar la review vacía.');
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(REVIEWS_KEY);
      const all: Review[] = raw ? JSON.parse(raw) : [];

      const now = new Date().toISOString();
      const idx = all.findIndex((r) => r.movieId === movieIdStr);

      const finalTitle = movieTitle?.toString() || 'Película';

      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          rating,
          body,
          createdAt: now,
          movieTitle: finalTitle,
        };
      } else {
        all.push({
          movieId: movieIdStr,
          movieTitle: finalTitle,
          rating,
          body,
          createdAt: now,
        });
      }

      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
      Alert.alert('Listo', 'Tu review se guardó correctamente.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error guardando review:', error);
      Alert.alert('Error', 'No se pudo guardar la review. Intentá de nuevo.');
    }
  };

  const renderStars = () => (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, i) => {
        const starIndex = i + 1;
        const filled = starIndex <= rating;
        return (
          <TouchableOpacity key={i} onPress={() => setRating(starIndex)}>
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={32}
              color="#ffd700"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title={isEditing ? 'Editar review' : 'Dejar review'} />

      {/* Botón volver */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={26} color="white" />
      </TouchableOpacity>

      <View style={{ marginTop: 70 }}>
        <Text style={styles.movieTitle}>
          {movieTitle ? movieTitle : 'Película'}
        </Text>

        <Text style={styles.label}>Puntuación</Text>
        {renderStars()}

        <Text style={styles.label}>Tu opinión</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribí qué te pareció la película..."
          placeholderTextColor="#888"
          multiline
          value={body}
          onChangeText={setBody}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Guardar cambios' : 'Publicar review'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', paddingHorizontal: 16 },
  backButton: { position: 'absolute', top: 65, left: 16, zIndex: 50 },
  movieTitle: {
    color: '#ddd',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  input: {
    marginTop: 4,
    minHeight: 120,
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