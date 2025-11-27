import { TMDB_API_KEY } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

import { useAuth } from '@/context/authContext';
import reviewsApi, { ReviewDto } from '@/services/reviewsApi';

interface Review {
  id: number;
  date: string;
  rating: number;
  subject: string;
  content: string;
  authorEmail: string;
  authorName: string;
  movieid: number;
}

const MisReviews: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [tusReviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBackPress = (): void => {
    router.back();
  };

  useEffect(() => {
    const cargar = async () => {
      if (!user) {
        setReviews([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const apiReviews: ReviewDto[] = await reviewsApi.getByUser(user.uid);

        const mapped: Review[] = await Promise.all(
          apiReviews.map(async (r) => {
            let movieTitle = `Película ${r.movie_id}`;
            try {
              const res = await fetch(
                `https://api.themoviedb.org/3/movie/${r.movie_id}?language=es-AR&api_key=${TMDB_API_KEY}`,
              );
              const data = await res.json();
              if (data?.title) {
                movieTitle = data.title;
              }
            } catch (error) {
              console.warn('Error obteniendo título de película', error);
            }

            return {
              id: r.id,
              date: r.created_at,
              rating: r.rating,
              subject: movieTitle,          // título de la peli
              content: r.comment || '',     // cuerpo de la review
              authorEmail: user.email ?? '',
              authorName: 'Vos',            // siempre vos en MisReviews
              movieid: r.movie_id,
            };
          }),
        );

        // ordenar por fecha (más nuevas primero)
        mapped.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setReviews(mapped);
      } catch (error) {
        console.error('Error cargando reviews del usuario:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [user]);

  const handlePressReview = (review: Review) => {
  Alert.alert(
    'Review',
    '¿Qué querés hacer con esta review?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Editar',
        onPress: () => {
          router.push({
            pathname: '/menu/reviews/escribir',
            params: {
              movieId: review.movieid.toString(),
              title: review.subject,
            },
          });
        },
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await reviewsApi.delete(review.id);
            // Sacarla de la lista local
            setReviews((prev) => prev.filter((r) => r.id !== review.id));
          } catch (e) {
            console.error('Error eliminando review:', e);
            Alert.alert(
              'Error',
              'No se pudo eliminar la review. Intentá de nuevo.',
            );
          }
        },
      },
    ],
    { cancelable: true },
  );
};

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
          <Text style={{ color: 'white' }}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>CineApp</Text>
          <Image
            source={require('../../assets/images/adaptive-icon.png')}
            style={styles.logo}
          />
        </View>

        {/* Contenido */}
        <ScrollView style={styles.container}>
          <Text style={styles.titulo}>Mis Reviews</Text>
          {tusReviews.length === 0 ? (
            <Text style={styles.sinCupones}>
              No realizaste ninguna review.
            </Text>
          ) : (
            tusReviews.map((r: Review, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.infoContainer}
                onPress={() => handlePressReview(r)}
              >
                <View>
                  <View style={styles.titleStars}>
                    <Text style={styles.infoTitle}>{r.authorName}</Text>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star: number) => (
                        <TouchableOpacity
                          key={star}
                          style={styles.starButton}
                        >
                          <Ionicons
                            name={
                              star <= r.rating ? 'star' : 'star-outline'
                            }
                            size={10}
                            color={star <= r.rating ? '#FFD700' : '#666'}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.infoText}>{r.subject}</Text>
                  <Text style={styles.infoText}>{r.content}</Text>
                  <Text style={styles.fecha}>
                    {new Date(r.date).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(20),
  },
  backButton: {
    padding: moderateScale(4),
  },
  title: {
    fontSize: moderateScale(24),
    color: '#ffffff',
    fontWeight: 'bold',
  },
  logo: {
    width: moderateScale(50),
    height: moderateScale(50),
  },
  titulo: {
    fontSize: moderateScale(22),
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
    marginLeft: 20,
    marginTop: 35,
  },
  sinCupones: {
    color: 'white',
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginTop: verticalScale(50),
  },
  infoContainer: {
    backgroundColor: '#2a2a2a',
    margin: moderateScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  infoTitle: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  infoText: {
    color: '#ccc',
    fontSize: moderateScale(14),
    marginBottom: verticalScale(12),
  },
  fecha: {
    flexDirection: 'row',
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  starButton: {
    padding: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  titleStars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(2),
  },
});

export default MisReviews;