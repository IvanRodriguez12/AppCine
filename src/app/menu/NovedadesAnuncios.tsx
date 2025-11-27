import Header from '@/components/Header';
import newsService, { News as BackendNews } from '@/services/newsService';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  id: string;
  title: string;
  date: string;      // formateada: "13 NOV 2025"
  category: string;  // ej: "NOTICIAS"
  subtitle: string;  // usamos la descripción corta
  content: string;   // cuerpo largo
  imageUrl?: string; // URL de imagen (opcional)
}

const NovedadesAnuncios: React.FC = () => {
  const router = useRouter();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatDate = (isoDate: string): string => {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;

    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = meses[d.getMonth()];
    const anio = d.getFullYear();

    return `${dia} ${mes} ${anio}`;
  };

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      setError(null);

      const response = await newsService.getNews();

      if (!response.success || !response.data) {
        setError(response.error || response.message || 'No se pudieron cargar las noticias');
        setLoading(false);
        return;
      }

      const mapped: NewsItem[] = response.data.map((n: BackendNews) => ({
        id: n.id,
        title: n.title,
        date: formatDate(n.date),
        category: 'NOTICIAS',
        subtitle: n.description,
        content: n.body,
        imageUrl: n.imageUrl,
      }));

      setNews(mapped);
      setLoading(false);
    };

    loadNews();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="CineApp"
        onBack={() => {
          selectedNews ? setSelectedNews(null) : router.back();
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Cargando noticias...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : selectedNews ? (
        <ScrollView style={styles.content}>
          <Text style={styles.newsTitle}>{selectedNews.title}</Text>
          <Text style={styles.newsDate}>
            {selectedNews.date} | {selectedNews.category}
          </Text>

          {selectedNews.imageUrl ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedNews.imageUrl }}
                style={styles.newsImage}
                resizeMode="cover"
              />
            </View>
          ) : null}

          <Text style={styles.newsContent}>{selectedNews.content}</Text>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>NOVEDADES/</Text>
          <Text style={styles.sectionTitle}>ANUNCIOS</Text>

          {news.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.newsCard}
              onPress={() => setSelectedNews(item)}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
              <Text style={styles.cardDate}>{item.date}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(8),
    color: '#ccc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
  },
  errorText: {
    color: '#ff7675',
    textAlign: 'center',
    fontSize: moderateScale(14),
  },
});

export default NovedadesAnuncios;