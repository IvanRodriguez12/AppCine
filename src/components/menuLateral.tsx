import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Ionicons,
  MaterialIcons,
  Entypo,
  AntDesign,
  Feather
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';
import ConfirmLogout from './ConfirmLogout';
import SessionClosed from './SessionClosed';

const { width, height } = Dimensions.get('window');

const MenuLateral = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const [nombre, setNombre] = useState('Usuario');
  const [correo, setCorreo] = useState('correo@gmail.com');
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showSessionClosed, setShowSessionClosed] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showThanksModal, setShowThanksModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [thanksMessage, setThanksMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const thanksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const u = await AsyncStorage.getItem('usuarioActual');
      if (u) {
        const user = JSON.parse(u);
        if (user.fullName) setNombre(user.fullName);
        if (user.email) setCorreo(user.email);
      }
    })();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, []);

  // Efecto para manejar el auto-cierre del modal de agradecimiento
useEffect(() => {
  if (showThanksModal) {
    // Configurar el timer para cerrar después de 3 segundos
    thanksTimerRef.current = setTimeout(() => {
      handleThanksClose();
    }, 3000);
  } else {
    // Limpiar el timer si el modal no está visible
    if (thanksTimerRef.current) {
      clearTimeout(thanksTimerRef.current);
      thanksTimerRef.current = null;
    }
  }

  // Cleanup function para limpiar el timer cuando el componente se desmonte
  return () => {
    if (thanksTimerRef.current) {
      clearTimeout(thanksTimerRef.current);
      thanksTimerRef.current = null;
    }
  };
}, [showThanksModal]);


  const handleLogoutPress = () => {
    setShowConfirmLogout(true);
  };

  const handleConfirmLogout = async () => {
    setShowConfirmLogout(false);
    await AsyncStorage.removeItem('usuarioActual');
    setShowSessionClosed(true);
  };

  const handleCancelLogout = () => {
    setShowConfirmLogout(false);
  };

  const handleSessionClosedComplete = () => {
    setShowSessionClosed(false);
    onClose();
    router.replace('/(auth)/inicio');
  };

  const handleRatingPress = () => {
    setShowRatingModal(true);
  };

  const handleStarPress = (star: number) => {
    setRating(star);
  };

  const handleRatingSubmit = () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }
    setShowRatingModal(false);
    setThanksMessage('¡Gracias por calificarnos!');
    setShowThanksModal(true);
  };

  const handleThanksClose = () => {
    setShowThanksModal(false);
    setRating(0);
    // Limpiar el timer si se cierra manualmente
    if (thanksTimerRef.current) {
      clearTimeout(thanksTimerRef.current);
      thanksTimerRef.current = null;
    }
  };

  const RatingModal = () => (
    <Modal
      visible={showRatingModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowRatingModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="star" size={40} color="#FFD700" />
            <Text style={styles.modalTitle}>¿Te gusta CineApp?</Text>
            <Text style={styles.modalSubtitle}>Califica tu experiencia con la app</Text>
          </View>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
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

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowRatingModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleRatingSubmit}
            >
              <Text style={styles.submitButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const ThanksModal = () => (
    <Modal
      visible={showThanksModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleThanksClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={handleThanksClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.modalTitle}>{thanksMessage}</Text>
            <Text style={styles.modalSubtitle}>Tu opinión es muy importante para nosotros</Text>
            <Text style={styles.autoCloseText}>Se cerrará automáticamente en 3 segundos</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <>
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />

        <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {nombre.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>{nombre}</Text>
              <Text style={styles.userEmail}>{correo}</Text>
            </View>
          </View>

          <MenuItem icon="percent" text="Cupones" />
          <MenuItem icon="shopping-bag" text="Mis Compras" />

          {/* Sección de ubicación */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/menu/Ubicacion')}>
            <Entypo name="location-pin" size={scale(20)} color="white" style={{ marginRight: scale(15) }} />
            <Text style={styles.menuItemText}>Ubicación</Text>
          </TouchableOpacity>

          <MenuItem icon="checkcircleo" text="Mis Reviews" library="AntDesign" />
          <MenuItem icon="heart" text="Mis Favoritos" library="AntDesign" />
          
          {/* Sección de calificación */}
          <TouchableOpacity style={styles.menuItem} onPress={handleRatingPress}>
            <AntDesign name="star" size={scale(20)} color="white" style={{ marginRight: scale(15) }} />
            <Text style={styles.menuItemText}>Calificar en Estrellas</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <MenuItem icon="info" text="Sobre Nosotros" library="Feather" />
          <MenuItem icon="person" text="Mi Cuenta" library="Ionicons" />
          <MenuItem icon="settings" text="Configuración" library="Feather" />

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
            <View style={styles.menuItem}>
              <AntDesign name="logout" size={scale(20)} color="red" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      {/* Modales */}
      <RatingModal />
      <ThanksModal />

      {/* Modal de confirmación de cierre de sesión */}
      <ConfirmLogout
        visible={showConfirmLogout}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
        userName={nombre}
        userEmail={correo}
      />

      {/* Modal de sesión cerrada */}
      <SessionClosed
        visible={showSessionClosed}
        onComplete={handleSessionClosedComplete}
      />
    </>
  );
};

const MenuItem = ({
  icon,
  text,
  library = 'MaterialIcons'
}: {
  icon: string;
  text: string;
  library?: 'MaterialIcons' | 'Entypo' | 'AntDesign' | 'Feather' | 'Ionicons';
}) => {
  const Icon = { MaterialIcons, Entypo, AntDesign, Feather, Ionicons }[library];
  return (
    <TouchableOpacity style={styles.menuItem}>
      <Icon name={icon as any} size={scale(20)} color="white" style={{ marginRight: scale(15) }} />
      <Text style={styles.menuItemText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: width,
    height: height,
    flexDirection: 'row',
    zIndex: 99
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  menu: {
    width: width * 0.75,
    height: height,
    backgroundColor: '#111',
    padding: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    position: 'absolute',
    left: 0,
    top: 0
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20)
  },
  avatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10)
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold'
  },
  userName: {
    color: 'white',
    fontWeight: 'bold'
  },
  userEmail: {
    color: '#ccc',
    fontSize: moderateScale(12)
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12)
  },
  menuItemText: {
    color: 'white',
    fontSize: moderateScale(16)
  },
  separator: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: verticalScale(10)
  },
  logoutButton: {
    marginTop: verticalScale(20)
  },
  logoutText: {
    color: 'red',
    marginLeft: scale(15),
    fontWeight: 'bold',
    fontSize: moderateScale(16)
  },
  // Estilos para los modales
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
  autoCloseText: {
    fontSize: moderateScale(12),
    color: '#999',
    marginTop: verticalScale(10),
    textAlign: 'center',
    fontStyle: 'italic'
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: verticalScale(25)
  },
  starButton: {
    marginHorizontal: moderateScale(5)
  },
  commentContainer: {
    width: '100%',
    marginBottom: verticalScale(25)
  },
  commentInput: {
    backgroundColor: '#333',
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    color: 'white',
    fontSize: moderateScale(16),
    minHeight: verticalScale(100),
    textAlignVertical: 'top'
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
  submitButton: {
    backgroundColor: 'red' // Cambiado a rojo para mantener consistencia con la app
  },
  cancelButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    textAlign: 'center'
  },
  submitButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    textAlign: 'center'
  }
});

export default MenuLateral;