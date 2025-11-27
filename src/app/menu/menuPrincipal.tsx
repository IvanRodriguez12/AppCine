import { TMDB_API_BASE_URL, TMDB_API_KEY, TMDB_IMAGE_BASE } from '@/app/config/tmdb';
import MenuLateral from '@/components/menuLateral';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const anchoPantalla = Dimensions.get('window').width;

const TMDB_API_URL = `${TMDB_API_BASE_URL}/movie/now_playing?language=es-AR&page=1&api_key=${TMDB_API_KEY}`;

interface Pelicula {
  id: number;
  title: string;
  poster_path: string;
}

const MenuPrincipal: React.FC = () => {
  const router = useRouter();
  const [indexSlide, setIndexSlide] = useState<number>(0);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);

  const handleNovedadesPress = (): void => {
    router.navigate('/menu/NovedadesAnuncios');
  };

  const fetchPeliculas = async () => {
    try {
      const response = await fetch(TMDB_API_URL);
      const data = await response.json();
      if (data.results) {
        setPeliculas(data.results.slice(0, 5));
      }
    } catch (error) {
      console.error('Error al obtener películas:', error);
    }
  };

  useEffect(() => {
    fetchPeliculas();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={35} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>CineApp</Text>
        <Image
          source={require('../../assets/images/adaptive-icon.png')}
          style={styles.logo}
        />
      </View>

      {/* Menú Lateral */}
      {menuVisible && <MenuLateral onClose={() => setMenuVisible(false)} />}

      {/* Botón de menú principal ajustado */}
      <View style={styles.menuPrincipalBtn}>
        <Text style={styles.menuPrincipalText}>MENU PRINCIPAL</Text>
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
          {peliculas.map((pelicula) => (
            <TouchableOpacity
              key={pelicula.id}
              style={styles.carouselItem}
              onPress={() => router.push('/menu/cartelera')}
            >
              {pelicula.poster_path ? (
                <Image
                  source={{ uri: `${TMDB_IMAGE_BASE}${pelicula.poster_path}` }}
                  style={styles.posterImage}
                />
              ) : (
                <View style={[styles.posterImage, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: 'white' }}>Sin imagen</Text>
                </View>
              )}
              <Text style={styles.carouselText}>{pelicula.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.dots}>
          {peliculas.map((_, i) => (
            <View key={i} style={[styles.dot, indexSlide === i && styles.dotActive]} />
          ))}
        </View>
      </View>

{/* Secciones */}
<View style={styles.sectionRow}>
  <TouchableOpacity style={styles.sectionEstrenos} onPress={() => router.push('/menu/cartelera')}>
    {peliculas[0]?.poster_path ? (
      <Image
        source={{ uri: `${TMDB_IMAGE_BASE}${peliculas[0].poster_path}` }}
        style={styles.sectionImage}
      />
    ) : null}
    <View style={styles.overlay}>
      <Ionicons name="play" size={28} color="white" />
      <Text style={styles.overlayText}>Estrenos /{'\n'}Próximamente</Text>
    </View>
  </TouchableOpacity>

  <TouchableOpacity style={styles.sectionCandy} onPress={() => router.push('/menu/CandyShop')}>
    <Image
      source={require('../../assets/images/Confiteria.png')}
      style={styles.sectionImage}
    />
    <View style={styles.overlay}>
      <Text style={styles.overlayText}>CANDY SHOP</Text>
    </View>
  </TouchableOpacity>
</View>

      <TouchableOpacity style={styles.sectionFull} onPress={() => router.push('/menu/Suscripcion')}>
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
    padding: moderateScale(1),
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
  menuPrincipalBtn: {
    backgroundColor: 'red',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    marginBottom: verticalScale(16),
    width: '100%',
  },
  menuPrincipalText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: moderateScale(18),
  },
  carouselContainer: {
    marginBottom: verticalScale(20),
  },
  carouselItem: {
    width: anchoPantalla - moderateScale(32),
    height: verticalScale(200),
    backgroundColor: 'black',
    borderRadius: moderateScale(12),
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    marginHorizontal: moderateScale(0.31),
  },
  posterImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: moderateScale(12),
    resizeMode: 'contain',
    borderColor: 'red',
    borderWidth: moderateScale(1),
  },
  carouselText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(16),
    marginBottom: verticalScale(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
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
  sectionEstrenos: {
    width: '48%',
    height: verticalScale(120),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  sectionCandy: {
    width: '48%',
    height: verticalScale(120),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    backgroundColor: '#4a4a4a',
  },
  sectionImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
  },
  overlayText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(13),
    textAlign: 'center',
    marginTop: verticalScale(6),
  },
  sectionFull: {
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(14),
  },
  sectionTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(16),
  },
  sectionSubText: {
    color: '#ccc',
    fontSize: moderateScale(13),
    marginTop: verticalScale(4),
  },
  sectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: verticalScale(14),
  },
  sectionText: {
    color: 'white',
    fontSize: moderateScale(16),
    marginLeft: moderateScale(8),
  },
});

export default MenuPrincipal;