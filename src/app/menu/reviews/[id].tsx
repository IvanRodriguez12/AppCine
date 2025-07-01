import { TMDB_API_KEY } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

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

type Pelicula = {
  poster_path: string;
  title: string;
  id: number;
};

const VerReviews = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cargando, setCargando] = useState(true);

  const escribirReview = async () => {
    try{
        await AsyncStorage.setItem('peliculaActual', JSON.stringify(pelicula));
        router.push(`/menu/reviews/escribir`)
    }catch(e){
        console.error(e);
    }
  }

  const fetchReviews = async () => {
    try {
    const reviewsGuardadas = await AsyncStorage.getItem('reviews');
    const reviews = reviewsGuardadas ? JSON.parse(reviewsGuardadas) : [];
    console.log(JSON.stringify(reviews))
    if(pelicula){
        const filtrados = reviews.filter((r:any) => r.movieid === pelicula.id);
        setReviews(filtrados);
    }
    } catch (e) {
    console.error(e);
    } finally {
    setCargando(false);
    }
    };

  const fetchPelicula = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?language=es-AR&api_key=${TMDB_API_KEY}`
        );
        const data = await res.json();
        setPelicula(data);
        fetchReviews();
      } catch (e) {
        console.error(e);
      } finally {
      }
    };

  if (id) fetchPelicula();

  if (cargando || !pelicula) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ff2b2b" />
      </View>
    );
  }

  return (
    <><SafeAreaView style={styles.container}>
       {/* Header */}
       <View style={styles.header}>
         <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
           <Ionicons name="arrow-back" size={28} color="white" />
         </TouchableOpacity>
         <Text style={styles.title}>CineApp</Text>
         <Image
           source={require('../../../assets/images/adaptive-icon.png')}
           style={styles.logo}
         />
       </View>
 
       {/* Contenido */}
       <ScrollView style={styles.container}>
         <Text style={styles.titulo}>Reviews de {pelicula.title}</Text>
        <TouchableOpacity
        style={styles.buyButton}
        onPress={() => escribirReview()}
        >
        <Text style={styles.buyButtonText}>Escribir Review</Text>
        </TouchableOpacity>
         {reviews.length === 0 ? (
         <Text style={styles.sinCupones}>No existen reviews de esta pelicula.</Text>
       ) : reviews.map((r, index) => (
         <View key={index} style={styles.infoContainer}>
           <View>
             <View style = {styles.titleStars}>
               <Text style={styles.infoTitle}>{r.authorName}</Text>
               <View style={styles.starsContainer}>
               {[1, 2, 3, 4, 5].map((star) => (
                 <TouchableOpacity key={star} style={styles.starButton}>
                   <Ionicons
                     name={star <= r.rating ? "star" : "star-outline"}
                     size={10}
                     color={star <= r.rating ? "#FFD700" : "#666"}
                   />
                 </TouchableOpacity>
               ))}
               </View>
             </View>
           <Text style={styles.infoText}>{r.subject}</Text>
           <Text style={styles.infoText}>{r.content}</Text>
           <Text style={styles.fecha}>{r.date}</Text>
           </View>
         </View>
       ))}
       </ScrollView>
       </SafeAreaView>
       </>
     );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(20),
  },
  poster: {
    width: 280,
    height: 400,
    borderRadius: 12,
    backgroundColor: '#444',
  },
  title: {
    fontSize: moderateScale(22),
    color: 'white',
    fontWeight: 'bold',
  },
    logo: {
    width: moderateScale(80),
    height: moderateScale(80),
    resizeMode: 'contain',
    borderRadius: moderateScale(8),
  },
  selectionArea: {
    flex: 1,
    paddingTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    marginBottom: 0,
  },
    buyButton: {
    backgroundColor: 'red',
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
  option: {
    backgroundColor: '#771111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'center',
    minWidth: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  selected: {
    backgroundColor: '#ff2b2b',
  },
  optionText: {
    color: 'white',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#ff2b2b',
    marginBottom: 100,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 0,
    alignSelf: 'stretch',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  backButton: {
    padding: moderateScale(4),
  },
    tituloCupon: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    fecha: {
      flexDirection: 'row',
      fontSize: 12,
      color: 'gray',
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    starsContainer: {
      flexDirection: 'row',
      alignSelf: 'flex-end',
      alignItems: 'center',
    },
    titleStars:{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: verticalScale(2),
    },
    starButton: {
        marginHorizontal: moderateScale(3)
    },
    sinCupones: {
    color: 'gray',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    },
    infoContainer: {
        backgroundColor: '#2a2a2a',
        margin: moderateScale(16),
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
    },
      titulo: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginVertical: 16,
    alignSelf: 'center',
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
});

export default VerReviews;