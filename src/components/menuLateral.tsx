import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated
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

const { width, height } = Dimensions.get('window');

const MenuLateral = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const [nombre, setNombre] = useState('Usuario');
  const [correo, setCorreo] = useState('correo@ejemplo.com');
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;

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

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem('usuarioActual');
    router.replace('/(auth)/inicio');
  };

  return (
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
        <MenuItem icon="location-pin" text="Ubicación" library="Entypo" />
        <MenuItem icon="checkcircleo" text="Mis Reviews" library="AntDesign" />
        <MenuItem icon="heart" text="Mis Favoritos" library="AntDesign" />
        <MenuItem icon="star" text="Calificar" library="AntDesign" />

        <View style={styles.separator} />

        <MenuItem icon="info" text="Sobre Nosotros" library="Feather" />
        <MenuItem icon="person" text="Mi Cuenta" library="Ionicons" />
        <MenuItem icon="settings" text="Configuración" library="Feather" />

        <TouchableOpacity style={styles.logoutButton} onPress={cerrarSesion}>
          <View style={styles.menuItem}>
            <AntDesign name="logout" size={scale(20)} color="red" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
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
  }
});

export default MenuLateral;