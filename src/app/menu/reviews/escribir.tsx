import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

  const colors = {
    primary: '#E50914',
    darkBg: '#000000',
    lightText: '#FFFFFF',
    inputBg: '#333333',
    placeholder: '#8C8C8C',
    divider: '#404040',
  };

const EscribirReview = () => {
    const router = useRouter();
    const [contenido, setContenido] = useState('');
    const [rating, setRating] = useState(0);
    const sendReview = async () => {
         try {
            const reviewsGuardadas = await AsyncStorage.getItem('reviews');
            const reviews = reviewsGuardadas ? JSON.parse(reviewsGuardadas) : [];

            const usuarioData = await AsyncStorage.getItem('usuarioActual');
            const usuario = usuarioData ? JSON.parse(usuarioData) : [];
            
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();

            const peliculaData = await AsyncStorage.getItem('peliculaActual');
            const pelicula = peliculaData ? JSON.parse(peliculaData) : [];

            const nuevaReview = {
                id: reviews.length+1,
                date: day+"/"+month+"/"+year,
                rating: rating,
                subject: pelicula.title,
                content: contenido,
                authorEmail: usuario.email,
                authorName: usuario.fullName,
                movieid: pelicula.id,
            };

            if(!usuarioData || !peliculaData || contenido.length === 0){return}

            reviews.push(nuevaReview);
            await AsyncStorage.setItem('reviews', JSON.stringify(reviews));
            router.back()
         }catch{}
    }
    return (
    <SafeAreaView style={styles.container}>
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

        <Text style={[styles.texttitle, {color: colors.lightText}]}>Contenido de la Review </Text>
        <TextInput
            style={[
            styles.input, 
            {
                backgroundColor: colors.inputBg,
                color: colors.lightText,
                borderColor: colors.divider,
                height: moderateScale(140),
                verticalAlign: 'top',
                borderRadius: moderateScale(8),
                margin: moderateScale(12),
            }
            ]}
            placeholder="Ingresa el contenido de la review"
            placeholderTextColor={colors.placeholder}
            value={contenido}
            onChangeText={setContenido}
            autoCapitalize="words"
            textContentType="name"
        />
        <Text style={[styles.texttitle, {color: colors.lightText}]}>Rating de la Pelicula</Text>

        <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={40}
                  color={star <= rating ? "#FFD700" : "#666"}
                />
              </TouchableOpacity>
            ))}
          </View>

        <TouchableOpacity style={styles.buyButton} onPress={() => sendReview()}>
            <Text style={styles.buyButtonText}>Enviar review</Text>
        </TouchableOpacity>
    </SafeAreaView>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 8,
  },
    backButton: {
    padding: moderateScale(4),
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
    resizeMode: 'contain',
    borderRadius: moderateScale(8),
  },
    header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(20),
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(24),
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(40),
    alignItems: 'center'
  },
  texttitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
    textAlign: 'center',
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
  title: {
    fontSize: moderateScale(22),
    color: 'white',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    marginBottom: verticalScale(24),
  },
  label: {
    fontSize: moderateScale(16),
    marginBottom: verticalScale(8),
  },
  input: {
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
    fontSize: moderateScale(16),
  },
  registerButton: {
    borderRadius: moderateScale(8),
    padding: verticalScale(16),
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(24),
  },
    starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: verticalScale(25)
  },
  starButton: {
    marginHorizontal: moderateScale(5)
  },
});

export default EscribirReview;