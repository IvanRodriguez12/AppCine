// src/app/menu/MisReviews.tsx
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
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

const MisReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const cargarReviews = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await AsyncStorage.getItem(REVIEWS_KEY);
      const all: Review[] = raw ? JSON.parse(raw) : [];
      // Ordenamos por fecha
      all.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReviews(all);
    } catch (e) {
      console.error('Error cargando mis reviews:', e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarReviews();
    }, [cargarReviews])
  );

  const handlePressReview = (review: Review) => {
    Alert.alert(
      'Review',
      '¿Querés editar esta review?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Editar',
          onPress: () => {
            router.push({
              pathname: '/menu/reviews/escribir',
              params: {
                movieId: review.movieId,
                title: review.movieTitle,
              },
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }: { item: Review }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handlePressReview(item)}
    >
      <Text style={styles.movieTitle}>{item.movieTitle}</Text>
      <View style={styles.row}>
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < item.rating ? 'star' : 'star-outline'}
              size={16}
              color="#ffd700"
            />
          ))}
        </View>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text
        style={styles.body}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {item.body}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Mis reviews" />

      {/* botón volver */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={26} color="white" />
      </TouchableOpacity>

      <View style={{ marginTop: 70, paddingHorizontal: 16, flex: 1 }}>
        {loading ? (
          <Text style={{ color: 'white' }}>Cargando...</Text>
        ) : reviews.length === 0 ? (
          <Text style={styles.emptyText}>
            Todavía no escribiste ninguna review.
          </Text>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  backButton: { position: 'absolute', top: 65, left: 16, zIndex: 50 },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#1f1f1f',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  movieTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsRow: { flexDirection: 'row', gap: 2 },
  date: { color: '#999', fontSize: 11 },
  body: { color: '#ddd', fontSize: 13, marginTop: 6 },
});

export default MisReviews;