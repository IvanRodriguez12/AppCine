import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { moderateScale, verticalScale } from 'react-native-size-matters';

interface Cinema {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const Ubicacion: React.FC = () => {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  
  // Animaciones para los desplegables
  const cinesAnimation = useRef(new Animated.Value(0)).current;
  const resistenciaAnimation = useRef(new Animated.Value(0)).current;
  
  // Animación para la sección de ubicación seleccionada
  const selectedCinemaAnimation = useRef(new Animated.Value(0)).current;

  const cinemas: Cinema[] = [
    {
      id: '1',
      name: 'Sarmiento Shopping',
      address: 'Av. Sarmiento 2610 - Sarmiento Shopping',
      coordinates: {
        latitude: -27.431521078040007,
        longitude: -58.96346641603882,
      },
    },
    {
      id: '2',
      name: 'Cinemacenter',
      address: 'Av. Lavalle 826 - Cinemacenter',
      coordinates: {
        latitude: -27.438054039750458,
        longitude: -58.98744243931929,
      },
    },
  ];

  // Efecto para animar la aparición de la ubicación seleccionada
  useEffect(() => {
    if (selectedCinema) {
      Animated.spring(selectedCinemaAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(selectedCinemaAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [selectedCinema]);

  const handleBackPress = (): void => {
    router.back();
  };

  const toggleSection = (section: string): void => {
    const isExpanding = expandedSection !== section;
    
    // Ocultar la ubicación seleccionada cuando se presiona cualquier botón de navegación
    if (selectedCinema) {
      setSelectedCinema(null);
    }
    
    if (expandedSection && expandedSection !== section) {
      // Cerrar la sección actual primero
      const currentAnimation = expandedSection === 'cines' ? cinesAnimation : resistenciaAnimation;
      Animated.timing(currentAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    if (isExpanding) {
      setExpandedSection(section);
      const animation = section === 'cines' ? cinesAnimation : resistenciaAnimation;
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      const animation = section === 'cines' ? cinesAnimation : resistenciaAnimation;
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setExpandedSection(null);
      });
    }
  };

  const handleCinemaSelect = (cinema: Cinema): void => {
    setSelectedCinema(cinema);
    // No abrir Google Maps directamente, solo seleccionar
  };

  const openInGoogleMaps = (cinema: Cinema): void => {
    const url = `https://www.google.com/maps/search/?api=1&query=${cinema.coordinates.latitude},${cinema.coordinates.longitude}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'No se puede abrir el mapa');
        }
      })
      .catch(() => Alert.alert('Error', 'No se puede abrir el mapa'));
  };

  const DropdownButton: React.FC<{
    title: string;
    section: string;
    icon: string;
    isExpanded: boolean;
    onPress: () => void;
  }> = ({ title, section, icon, isExpanded, onPress }) => (
    <TouchableOpacity style={styles.dropdownButton} onPress={onPress}>
      <View style={styles.dropdownContent}>
        <Ionicons name={icon as any} size={24} color="white" />
        <Text style={styles.dropdownText}>{title}</Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color="white"
        />
      </View>
    </TouchableOpacity>
  );

  const CinemaOption: React.FC<{ cinema: Cinema }> = ({ cinema }) => (
    <TouchableOpacity
      style={styles.cinemaOption}
      onPress={() => handleCinemaSelect(cinema)}
    >
      <View style={styles.cinemaInfo}>
        <Ionicons name="location" size={20} color="#ff0000" />
        <Text style={styles.cinemaAddress}>{cinema.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Título de sección */}
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>UBICACIÓN</Text>
      </View>

      {/* Información adicional con animación */}
      {selectedCinema && (
        <Animated.View
          style={[
            styles.infoContainer,
            {
              opacity: selectedCinemaAnimation,
              transform: [
                {
                  translateY: selectedCinemaAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
                {
                  scale: selectedCinemaAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.infoTitle}>Ubicación Seleccionada:</Text>
          <Text style={styles.infoText}>{selectedCinema.address}</Text>
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => openInGoogleMaps(selectedCinema)}
          >
            <Ionicons name="navigate" size={20} color="white" />
            <Text style={styles.directionsText}>Ver en Mapa</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Controles desplegables */}
      <View style={styles.controlsContainer}>
        {/* Botón Cines */}
        <DropdownButton
          title="Cines"
          section="cines"
          icon="film"
          isExpanded={expandedSection === 'cines'}
          onPress={() => toggleSection('cines')}
        />

        {/* Contenido desplegable de Cines */}
        <Animated.View
          style={[
            styles.expandableContent,
            {
              maxHeight: cinesAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 60],
              }),
              opacity: cinesAnimation,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.subButton}
            onPress={() => toggleSection('Resistencia')}
          >
            <View style={styles.subButtonContent}>
              <Ionicons name="business" size={20} color="white" />
              <Text style={styles.subButtonText}>Resistencia</Text>
            </View>
            <Ionicons
              name={expandedSection === 'Resistencia' ? "chevron-up" : "chevron-down"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Contenido desplegable de Resistencia */}
        <Animated.View
          style={[
            styles.expandableContent,
            {
              maxHeight: resistenciaAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 120],
              }),
              opacity: resistenciaAnimation,
            },
          ]}
        >
          {cinemas.map((cinema) => (
            <CinemaOption key={cinema.id} cinema={cinema} />
          ))}
        </Animated.View>
      </View>
    </SafeAreaView>
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
    marginBottom: verticalScale(8),
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
});

export default Ubicacion;