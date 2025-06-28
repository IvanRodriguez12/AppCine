import Header from '@/components/Header';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

interface NewsItem {
  id: number;
  title: string;
  date: string;
  category: string;
  subtitle: string;
  content: string;
}

const NovedadesAnuncios: React.FC = () => {
  const router = useRouter();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    const backAction = () => {
      if (selectedNews) {
        setSelectedNews(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedNews]);

  const newsData: NewsItem[] = [
    {
      id: 1,
      title: 'Festival de Cannes 2025',
      date: '13 SEP 2025',
      category: 'NOTICIAS',
      subtitle: 'Las películas más esperadas del festival',
      content: `El Festival de Cannes ha anunciado la selección oficial para su edición 2025, que se celebrará del 13 al 24 de Septiembre.

Entre las películas más esperadas destacan el nuevo trabajo de Denis Villeneuve y el regreso de Sofia Coppola.

La ceremonia de apertura contará con estrellas internacionales y promete un evento inolvidable.`,
    },
    {
      id: 2,
      title: '2x1 en palomitas',
      date: '03 JUL 2025',
      category: 'PROMOCIÓN',
      subtitle: 'Promoción especial para suscriptores',
      content: `¡Oferta especial para nuestros suscriptores! Durante todo el mes de Julio podrás disfrutar de 2x1 en palomitas medianas y grandes.

Esta promoción es válida únicamente para miembros del programa de suscripción CineApp Premium.

Realiza tu compra desde la CineApp con tu cuenta, o presenta tu cuenta de suscriptor en la dulcería y disfruta de esta increíble oferta.`,
    },
    {
      id: 3,
      title: 'Nolan prepara nuevo proyecto',
      date: '01 JUL 2025',
      category: 'NOTICIAS',
      subtitle: 'El director anuncia su nueva película',
      content: `Christopher Nolan ha confirmado oficialmente su próximo proyecto cinematográfico, que comenzará a filmarse este verano.

La película explorará temas de ciencia ficción y contará con un reparto estelar que incluye actores ganadores del Oscar.

El estreno está programado para julio de 2026 en formato IMAX.`,
    }
  ];

  const getNewsImage = (id: number) => {
    switch (id) {
      case 1:
        return require('../../assets/images/cannes.jpg');
      case 2:
        return require('../../assets/images/palomitas.jpg');
      case 3:
        return require('../../assets/images/Christopher-Nolan-6.jpg');
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="CineApp"
        onBack={() => {
          selectedNews ? setSelectedNews(null) : router.back();
        }}
      />

      {selectedNews ? (
        <ScrollView style={styles.content}>
          <Text style={styles.newsTitle}>{selectedNews.title}</Text>
          <Text style={styles.newsDate}>
            {selectedNews.date} | {selectedNews.category}
          </Text>

          <View style={styles.imageContainer}>
            <Image
              source={getNewsImage(selectedNews.id)}
              style={styles.newsImage}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.newsContent}>{selectedNews.content}</Text>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>NOVEDADES/</Text>
          <Text style={styles.sectionTitle}>ANUNCIOS</Text>

          {newsData.map((news) => (
            <TouchableOpacity
              key={news.id}
              style={styles.newsCard}
              onPress={() => setSelectedNews(news)}
            >
              <Text style={styles.cardTitle}>{news.title}</Text>
              <Text style={styles.cardSubtitle}>{news.subtitle}</Text>
              <Text style={styles.cardDate}>{news.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: moderateScale(16),
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: moderateScale(24),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(5),
  },
  newsCard: {
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
    marginTop: verticalScale(10),
  },
  cardTitle: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  cardSubtitle: {
    color: '#ccc',
    fontSize: moderateScale(13),
    marginBottom: verticalScale(8),
  },
  cardDate: {
    color: '#999',
    fontSize: moderateScale(12),
  },
  newsTitle: {
    fontSize: moderateScale(24),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  newsDate: {
    color: '#ccc',
    fontSize: moderateScale(13),
    marginBottom: verticalScale(16),
  },
  imageContainer: {
    width: '100%',
    height: verticalScale(200),
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  newsContent: {
    color: 'white',
    fontSize: moderateScale(15),
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(24),
  },
});

export default NovedadesAnuncios;