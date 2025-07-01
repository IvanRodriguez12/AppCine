import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
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

const MisReviews: React.FC = () => {
    const router = useRouter();
    const handleBackPress = (): void => {
        router.back();
    };
    const [tusReviews, setReviews] = useState<Review[]>([]);
    
    useEffect(() => {
    const cargar = async () => {
      try{
        const reviewsGuardadas = await AsyncStorage.getItem('reviews');
        const reviews = reviewsGuardadas ? JSON.parse(reviewsGuardadas) : [];

        const usuarioData = await AsyncStorage.getItem('usuarioActual');
        const usuario = usuarioData ? JSON.parse(usuarioData) : [];

        const filtrados = reviews.filter((r:any) => usuario.email === r.authorEmail);
        setReviews(filtrados);
      }catch{

      }
    };
    cargar();
    }, []);
    
    return (
   <><SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
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
        <Text style={styles.sinCupones}>No realizaste ninguna review.</Text>
      ) : tusReviews.map((r, index) => (
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
  textoption: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    marginBottom: verticalScale(16),
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(15),
    alignItems: 'center',
    margin: moderateScale(16),
    padding: moderateScale(16),
  },
  controlsContainer: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: verticalScale(20),
  },
  dropdownButton: {
    backgroundColor: '#ff0000',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    overflow: 'hidden',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(15),
    paddingHorizontal: moderateScale(16),
  },
  dropdownText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    flex: 1,
    marginLeft: moderateScale(12),
  },
  expandableContent: {
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    overflow: 'hidden',
  },
  subButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(15),
    paddingHorizontal: moderateScale(16),
    backgroundColor: '#ff0000',
    marginBottom: verticalScale(4),
  },
  subButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(8),
  },
  cinemaOption: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  cinemaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cinemaAddress: {
    color: 'white',
    fontSize: moderateScale(14),
    marginLeft: moderateScale(8),
    flex: 1,
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
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff0000',
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(6),
    alignSelf: 'flex-start',
  },
  directionsText: {
    color: 'white',
    fontSize: moderateScale(14),
    marginLeft: moderateScale(6),
    fontWeight: 'bold',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(40),
    paddingBottom: verticalScale(30),
  },
  navIcon: {
    padding: moderateScale(10),
  },
  appicon: {
    width: 64,
    height: 64,
    resizeMode: 'stretch',
  },
  recordButton: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: 'red',
  },
  sectionTitleContainer: {
    paddingHorizontal: moderateScale(16),
    marginBottom: verticalScale(15),
  },
  sectionTitle: {
    fontSize: moderateScale(22),
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20)
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: moderateScale(20),
    padding: moderateScale(25),
    width: '90%',
    maxWidth: moderateScale(400),
    alignItems: 'center'
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(25)
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: 'white',
    marginTop: verticalScale(10),
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: moderateScale(14),
    color: '#ccc',
    marginTop: verticalScale(5),
    textAlign: 'center'
  },
    modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  modalButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(5)
  },
  cancelButton: {
    backgroundColor: '#444'
  },
  cancelButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    textAlign: 'center'
  },
  titulo: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginVertical: 16,
    alignSelf: 'center',
  },
  sinCupones: {
    color: 'gray',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  cupon: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 10,
  },
  starButton: {
    marginHorizontal: moderateScale(3)
  },
  icono: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  textoContainer: {
    flex: 1,
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
    justifyContent: 'space-between',
    marginBottom: verticalScale(2),
  }
});

export default MisReviews;