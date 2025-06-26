import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { moderateScale } from 'react-native-size-matters';

const anchoPantalla = Dimensions.get('window').width;

const MenuPrincipal = () => {
  const router = useRouter();
  const [indexSlide, setIndexSlide] = useState(0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>APPCINE</Text>
        <Image
            source={require('../../assets/images/adaptive-icon.png')}
            style={{
            width: moderateScale(80),
            height: moderateScale(80),
            resizeMode: 'contain',
            borderRadius: 8,
        }}
        />

      </View>

      {/* Botón de menú principal y carrito */}
      <View style={styles.menuRow}>
        <View style={styles.menuPrincipalBtn}>
        <Text style={styles.menuPrincipalText}>MENU PRINCIPAL</Text>
        </View>

        <TouchableOpacity style={styles.cartIcon}>
          <FontAwesome5 name="shopping-cart" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Carrusel de películas */}
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const slideIndex = Math.round(e.nativeEvent.contentOffset.x / anchoPantalla);
            setIndexSlide(slideIndex);
          }}
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <View key={num} style={styles.carouselItem}>
              <Text style={styles.carouselText}>PELICULA {num}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.dots}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[styles.dot, indexSlide === i && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      {/* Secciones */}
      <View style={styles.sectionRow}>
        <TouchableOpacity style={styles.sectionBox}>
          <Ionicons name="play-circle" size={36} color="white" />
          <Text style={styles.sectionText}>Estrenos / Próximamente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>CANDY SHOP</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.sectionFull}>
        <Text style={styles.sectionTitle}>SUSCRIPCIÓN</Text>
        <Text style={styles.sectionSubText}>Accede a diferentes promociones y más</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sectionFull}>
        <Text style={styles.sectionTitle}>NOVEDADES / ANUNCIOS</Text>
        <Text style={styles.sectionSubText}>Últimas noticias y promociones</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  menuButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  menuPrincipalBtn: {
    flex: 1,
    backgroundColor: 'red',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  menuPrincipalText: {
    fontWeight: 'bold',
    color: 'white',
  },
  cartIcon: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 6,
  },
  carouselContainer: {
    marginBottom: 20,
  },
  carouselItem: {
    width: anchoPantalla - 32,
    height: 100,
    backgroundColor: '#4a4a4a',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  carouselText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    backgroundColor: '#666',
  },
  dotActive: {
    backgroundColor: 'white',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionBox: {
    width: '48%',
    backgroundColor: '#4a4a4a',
    borderRadius: 10,
    alignItems: 'center',
    padding: 12,
  },
  sectionText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionFull: {
    backgroundColor: '#4a4a4a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  sectionSubText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
});

export default MenuPrincipal;