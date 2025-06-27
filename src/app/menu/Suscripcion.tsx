import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const Suscripcion: React.FC = () => {
  const router = useRouter();

  const handleComprarPress = (): void => {
    // Aquí puedes agregar la lógica para procesar la compra
    console.log('Procesando compra de suscripción...');
  };

  const handleBackPress = (): void => {
    router.back();
  };

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

      {/* Título principal */}
      <Text style={styles.mainTitle}>DETALLES SUSCRIPCIÓN</Text>

      {/* Card de suscripción */}
      <View style={styles.subscriptionCard}>
        <Text style={styles.subscriptionTitle}>Suscripción</Text>
        <Text style={styles.price}>$9.99/mes</Text>
      </View>

      {/* Beneficios */}
      <Text style={styles.benefitsTitle}>Beneficios</Text>
      
      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Acceso anticipado a entradas</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Descuentos especiales</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Coleccionables limitados</Text>
        </View>
      </View>

      {/* Botón de comprar */}
      <TouchableOpacity style={styles.buyButton} onPress={handleComprarPress}>
        <Text style={styles.buyButtonText}>Comprar</Text>
      </TouchableOpacity>

      {/* Bottom navigation icons */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navIcon}>
          <Ionicons name="play" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navIcon}>
          <View style={styles.recordButton} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navIcon}>
          <Ionicons name="pause" size={24} color="white" />
        </TouchableOpacity>
      </View>
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
    marginBottom: verticalScale(30),
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
  mainTitle: {
    fontSize: moderateScale(24),
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: verticalScale(30),
  },
  subscriptionCard: {
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    marginBottom: verticalScale(30),
  },
  subscriptionTitle: {
    fontSize: moderateScale(20),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(10),
  },
  price: {
    fontSize: moderateScale(18),
    color: 'white',
    fontWeight: '600',
  },
  benefitsTitle: {
    fontSize: moderateScale(22),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: verticalScale(20),
  },
  benefitsList: {
    marginBottom: verticalScale(40),
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
  },
  benefitText: {
    fontSize: moderateScale(16),
    color: 'white',
    marginLeft: moderateScale(12),
    flex: 1,
  },
  buyButton: {
    backgroundColor: 'red',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  buyButtonText: {
    fontSize: moderateScale(18),
    color: 'white',
    fontWeight: 'bold',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(40),
    position: 'absolute',
    bottom: verticalScale(30),
    left: 0,
    right: 0,
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
});

export default Suscripcion;