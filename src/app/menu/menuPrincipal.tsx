import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import MenuLateral from '@/src/components/menuLateral';

const anchoPantalla = Dimensions.get('window').width;

const MenuPrincipal: React.FC = () => {
  const router = useRouter();
  const [indexSlide, setIndexSlide] = useState<number>(0);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  const handleNovedadesPress = (): void => {
  router.navigate('/menu/NovedadesAnuncios');
};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>APPCINE</Text>
        <Image
          source={require('../../assets/images/adaptive-icon.png')}
          style={styles.logo}
        />
      </View>

      {/* Menú Lateral */}
      {menuVisible && <MenuLateral onClose={() => setMenuVisible(false)} />}

      {/* Botón de menú principal y carrito */}
      <View style={styles.menuRow}>
        <View style={styles.menuPrincipalBtn}>
          <Text style={styles.menuPrincipalText}>MENU PRINCIPAL</Text>
        </View>

        <TouchableOpacity style={styles.cartIcon}>
          <FontAwesome5 name="shopping-cart" size={25} color="white" />
        </TouchableOpacity>
      </View>

      {/* Carrusel */}
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
            <TouchableOpacity key={num} style={styles.carouselItem}>
              <Text style={styles.carouselText}>PELICULA {num}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.dots}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.dot, indexSlide === i && styles.dotActive]} />
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

      <TouchableOpacity style={styles.sectionFull} onPress={handleNovedadesPress}>
        <Text style={styles.sectionTitle}>NOVEDADES / ANUNCIOS</Text>
        <Text style={styles.sectionSubText}>Últimas noticias y promociones</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: moderateScale(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
  },
  menuButton: {
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    marginBottom: verticalScale(16),
  },
  menuPrincipalBtn: {
    flex: 1,
    backgroundColor: 'red',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    height: moderateScale(64),
  },
  menuPrincipalText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: moderateScale(18),
  },
  cartIcon: {
    backgroundColor: 'red',
    padding: moderateScale(18),
    borderRadius: moderateScale(8),
  },
  carouselContainer: {
    marginBottom: verticalScale(20),
  },
  carouselItem: {
    width: anchoPantalla - moderateScale(32),
    height: verticalScale(160),
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: moderateScale(0.4),
  },
  carouselText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(20),
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(8),
  },
  dot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginHorizontal: moderateScale(3),
    backgroundColor: '#666',
  },
  dotActive: {
    backgroundColor: 'white',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  sectionBox: {
    width: '48%',
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(12),
    alignItems: 'center',
    padding: moderateScale(16),
  },
  sectionText: {
    color: 'white',
    fontSize: moderateScale(13),
    textAlign: 'center',
    marginTop: verticalScale(6),
  },
  sectionTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(16),
  },
  sectionFull: {
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(14),
  },
  sectionSubText: {
    color: '#ccc',
    fontSize: moderateScale(13),
    marginTop: verticalScale(4),
  },
});

export default MenuPrincipal;