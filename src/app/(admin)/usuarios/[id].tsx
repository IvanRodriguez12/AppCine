// app/(admin)/usuarios/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import AdminUsersService, { AdminUser } from '@/services/adminUsersService';

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const result = await AdminUsersService.getUser(id as string);
      if (result.success && result.data) {
        setUser(result.data.user);
      } else {
        Alert.alert('Error', 'Usuario no encontrado');
        router.back();
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
      Alert.alert('Error', 'No se pudo cargar el usuario');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
  try {
    setActionLoading(true);
    const result = await AdminUsersService.changeAccountStatus(
      id as string, 
      newStatus as any,
      `Cambio de estado a ${newStatus} por administrador`
    );
    
    if (result.success) {
      Alert.alert('Éxito', `Estado actualizado a: ${newStatus}`);
      // ✅ FORZAR RECARGA Y VOLVER
      router.back();
      // Opcional: usar un parámetro para forzar recarga en la lista
      setTimeout(() => {
        router.push('/(admin)/usuarios?refresh=' + Date.now());
      }, 100);
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo cambiar el estado');
  } finally {
    setActionLoading(false);
  }
};

const handleRoleChange = async (newRole: string) => {
  try {
    setActionLoading(true);
    const result = await AdminUsersService.changeUserRole(id as string, newRole as any);
    
    if (result.success) {
      Alert.alert('Éxito', `Rol actualizado a: ${newRole}`);
      // ✅ FORZAR RECARGA Y VOLVER
      router.back();
      // Opcional: usar un parámetro para forzar recarga en la lista
      setTimeout(() => {
        router.push('/(admin)/usuarios?refresh=' + Date.now());
      }, 100);
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo cambiar el rol');
  } finally {
    setActionLoading(false);
  }
};

const handleLevelChange = async (newLevel: string) => {
  try {
    setActionLoading(true);
    const result = await AdminUsersService.changeAccountLevel(id as string, newLevel as any);
    
    if (result.success) {
      Alert.alert('Éxito', `Nivel actualizado a: ${newLevel}`);
      // ✅ FORZAR RECARGA Y VOLVER
      router.back();
      // Opcional: usar un parámetro para forzar recarga en la lista
      setTimeout(() => {
        router.push('/(admin)/usuarios?refresh=' + Date.now());
      }, 100);
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo cambiar el nivel');
  } finally {
    setActionLoading(false);
  }
};

  const handleDeleteUser = () => {
    Alert.alert(
      'Eliminar Usuario',
      '¿Estás seguro de que quieres eliminar permanentemente este usuario? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AdminUsersService.deleteUser(id as string);
              if (result.success) {
                Alert.alert('Éxito', 'Usuario eliminado permanentemente');
                router.back();
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'suspended': return '#F59E0B';
      case 'banned': return '#EF4444';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#E50914';
      case 'moderator': return '#8B5CF6';
      case 'user': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return '#6B7280';
      case 'verified': return '#10B981';
      case 'premium': return '#F59E0B';
      case 'full': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const openImage = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => 
        Alert.alert('Error', 'No se pudo abrir la imagen')
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando usuario...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Usuario no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Stack.Screen 
        options={{
          title: user.displayName,
        }}
      />

      {/* Información Básica */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{user.phone || 'No proporcionado'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fecha Nacimiento</Text>
            <Text style={styles.infoValue}>
              {new Date(user.birthDate).toLocaleDateString()} ({user.age} años)
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Miembro desde</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Último login</Text>
            <Text style={styles.infoValue}>
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Nunca'}
            </Text>
          </View>
        </View>
      </View>

      {/* Estado y Roles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado y Roles</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Estado</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.accountStatus) }]}>
              <Text style={styles.statusBadgeText}>{user.accountStatus}</Text>
            </View>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Rol</Text>
            <View style={[styles.statusBadge, { backgroundColor: getRoleColor(user.role) }]}>
              <Text style={styles.statusBadgeText}>{user.role}</Text>
            </View>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Nivel</Text>
            <View style={[styles.statusBadge, { backgroundColor: getLevelColor(user.accountLevel) }]}>
              <Text style={styles.statusBadgeText}>{user.accountLevel}</Text>
            </View>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Premium</Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: user.isPremium ? '#10B981' : '#6B7280' 
            }]}>
              <Text style={styles.statusBadgeText}>
                {user.isPremium ? 'Sí' : 'No'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Verificaciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verificaciones</Text>
        <View style={styles.verificationGrid}>
          <View style={styles.verificationItem}>
            <Ionicons 
              name={user.isEmailVerified ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={user.isEmailVerified ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.verificationLabel}>Email</Text>
            <Text style={styles.verificationDate}>
              {user.emailVerifiedAt ? 
                new Date(user.emailVerifiedAt).toLocaleDateString() : 'No verificado'
              }
            </Text>
          </View>

          <View style={styles.verificationItem}>
            <Ionicons 
              name={user.dniUploaded ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={user.dniUploaded ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.verificationLabel}>DNI</Text>
            <Text style={styles.verificationDate}>
              {user.dniUploadedAt ? 
                new Date(user.dniUploadedAt).toLocaleDateString() : 'No subido'
              }
            </Text>
            {user.dniUrl && (
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={() => openImage(user.dniUrl!)}
              >
                <Text style={styles.imageButtonText}>Ver DNI</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.verificationItem}>
            <Ionicons 
              name={user.faceVerified ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={user.faceVerified ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.verificationLabel}>Rostro</Text>
            <Text style={styles.verificationDate}>
              {user.faceVerifiedAt ? 
                new Date(user.faceVerifiedAt).toLocaleDateString() : 'No verificado'
              }
            </Text>
            {user.faceVerificationScore && (
              <Text style={styles.scoreText}>
                Score: {(user.faceVerificationScore * 100).toFixed(1)}%
              </Text>
            )}
            {user.selfieUrl && (
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={() => openImage(user.selfieUrl!)}
              >
                <Text style={styles.imageButtonText}>Ver Selfie</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Acciones de Administración */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones de Administración</Text>
        
        {/* Cambiar Estado */}
        <View style={styles.actionGroup}>
          <Text style={styles.actionGroupTitle}>Cambiar Estado</Text>
          <View style={styles.actionButtons}>
            {['active', 'suspended', 'banned', 'pending'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.actionButton,
                  user.accountStatus === status && styles.actionButtonActive,
                  actionLoading && styles.actionButtonDisabled
                ]}
                onPress={() => handleStatusChange(status)}
                disabled={actionLoading}
              >
                <Text style={[
                  styles.actionButtonText,
                  user.accountStatus === status && styles.actionButtonTextActive
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cambiar Rol */}
        <View style={styles.actionGroup}>
          <Text style={styles.actionGroupTitle}>Cambiar Rol</Text>
          <View style={styles.actionButtons}>
            {['user', 'moderator', 'admin'].map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.actionButton,
                  user.role === role && styles.actionButtonActive,
                  actionLoading && styles.actionButtonDisabled
                ]}
                onPress={() => handleRoleChange(role)}
                disabled={actionLoading}
              >
                <Text style={[
                  styles.actionButtonText,
                  user.role === role && styles.actionButtonTextActive
                ]}>
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cambiar Nivel */}
        <View style={styles.actionGroup}>
          <Text style={styles.actionGroupTitle}>Cambiar Nivel</Text>
          <View style={styles.actionButtons}>
            {['basic', 'verified', 'premium', 'full'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.actionButton,
                  user.accountLevel === level && styles.actionButtonActive,
                  actionLoading && styles.actionButtonDisabled
                ]}
                onPress={() => handleLevelChange(level)}
                disabled={actionLoading}
              >
                <Text style={[
                  styles.actionButtonText,
                  user.accountLevel === level && styles.actionButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Eliminar Usuario */}
        <View style={styles.actionGroup}>
          <Text style={styles.actionGroupTitle}>Eliminar Usuario</Text>
          <TouchableOpacity
            style={[styles.deleteButton, actionLoading && styles.actionButtonDisabled]}
            onPress={handleDeleteUser}
            disabled={actionLoading}
          >
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Eliminar Permanentemente</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Información de Auth */}
      {user.authInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Firebase Auth</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email Verificado (Auth)</Text>
              <Text style={styles.infoValue}>
                {user.authInfo.emailVerified ? 'Sí' : 'No'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cuenta Deshabilitada</Text>
              <Text style={styles.infoValue}>
                {user.authInfo.disabled ? 'Sí' : 'No'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Creado en Auth</Text>
              <Text style={styles.infoValue}>
                {new Date(user.authInfo.creationTime).toLocaleDateString()}
              </Text>
            </View>
            {user.authInfo.lastSignInTime && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Último Sign In</Text>
                <Text style={styles.infoValue}>
                  {new Date(user.authInfo.lastSignInTime).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E50914',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#1A1A1A',
    margin: moderateScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: verticalScale(16),
  },
  infoGrid: {
    gap: verticalScale(12),
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#8C8C8C',
  },
  infoValue: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(12),
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
  statusBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  verificationGrid: {
    gap: verticalScale(16),
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    backgroundColor: '#000000',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#333333',
  },
  verificationLabel: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: moderateScale(12),
  },
  verificationDate: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
  },
  scoreText: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginLeft: moderateScale(8),
  },
  imageButton: {
    marginLeft: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    backgroundColor: '#E50914',
    borderRadius: moderateScale(6),
  },
  imageButtonText: {
    fontSize: moderateScale(12),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionGroup: {
    marginBottom: verticalScale(20),
  },
  actionGroupTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  actionButton: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    backgroundColor: '#333333',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#404040',
  },
  actionButtonActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#8C8C8C',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    backgroundColor: '#EF4444',
    borderRadius: moderateScale(8),
    gap: moderateScale(8),
  },
  deleteButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});