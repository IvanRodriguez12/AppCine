import { router } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useAuth } from '@/context/authContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Bienvenido, {user?.displayName || 'Admin'}
          </Text>
          <Text style={styles.roleText}>👑 Administrador</Text>
        </View>

        {/* Mensaje temporal */}
        <View style={styles.tempMessage}>
          <Text style={styles.tempTitle}>🚧 Panel en Construcción</Text>
          <Text style={styles.tempSubtitle}>
            Las funcionalidades admin se implementarán en las siguientes fases
          </Text>
        </View>

        {/* Secciones disponibles (deshabilitadas por ahora) */}
        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionTitle}>Próximas Funcionalidades:</Text>
          
          <View style={[styles.card, styles.disabledCard]}>
            <Text style={styles.cardIcon}>👥</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Gestión de Usuarios</Text>
              <Text style={styles.cardDescription}>Próximamente...</Text>
            </View>
          </View>

          <View style={[styles.card, styles.disabledCard]}>
            <Text style={styles.cardIcon}>🍿</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Pedidos de Golosinas</Text>
              <Text style={styles.cardDescription}>Próximamente...</Text>
            </View>
          </View>

          <View style={[styles.card, styles.disabledCard]}>
            <Text style={styles.cardIcon}>🍬</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Productos</Text>
              <Text style={styles.cardDescription}>Próximamente...</Text>
            </View>
          </View>

          <View style={[styles.card, styles.disabledCard]}>
            <Text style={styles.cardIcon}>🎟️</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Cupones</Text>
              <Text style={styles.cardDescription}>Próximamente...</Text>
            </View>
          </View>

          <View style={[styles.card, styles.disabledCard]}>
            <Text style={styles.cardIcon}>🎬</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Funciones</Text>
              <Text style={styles.cardDescription}>Próximamente...</Text>
            </View>
          </View>
        </View>

        {/* Botón de logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: moderateScale(20),
  },
  header: {
    marginBottom: verticalScale(30),
  },
  welcomeText: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(8),
  },
  roleText: {
    fontSize: moderateScale(16),
    color: '#E50914',
  },
  tempMessage: {
    backgroundColor: '#1A1A1A',
    padding: moderateScale(20),
    borderRadius: moderateScale(12),
    borderLeftWidth: 4,
    borderLeftColor: '#E50914',
    marginBottom: verticalScale(30),
  },
  tempTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(8),
  },
  tempSubtitle: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    lineHeight: moderateScale(20),
  },
  sectionsContainer: {
    marginBottom: verticalScale(30),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(16),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
    alignItems: 'center',
  },
  disabledCard: {
    opacity: 0.5,
  },
  cardIcon: {
    fontSize: moderateScale(32),
    marginRight: moderateScale(16),
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  cardDescription: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
  },
  logoutButton: {
    backgroundColor: '#E50914',
    padding: verticalScale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: verticalScale(20),
  },
  logoutButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});