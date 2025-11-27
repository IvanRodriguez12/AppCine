import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  FlatList,
  SafeAreaView
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import AdminUsersService, { AdminUser, UsersStats, UsersFilters } from '@/services/adminUsersService';

export default function UsuariosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UsersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<UsersFilters>({
    page: 1,
    limit: 20,
  });
  const [searchText, setSearchText] = useState('');
  const searchTimeoutRef = useRef<number | null>(null); // ✅ CAMBIO AQUÍ: number en lugar de NodeJS.Timeout

  // ✅ DETECTAR RECARGAS FORZADAS DESDE DETALLES
  useEffect(() => {
    if (params.refresh) {
      console.log('🔄 Recarga forzada detectada desde detalles');
      loadData();
      
      setTimeout(() => {
        router.replace('/(admin)/usuarios');
      }, 100);
    }
  }, [params.refresh]);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar usuarios
      const usersResult = await AdminUsersService.getUsers(filters);
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data.users);
      }

      // Cargar estadísticas
      const statsResult = await AdminUsersService.getStats();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data.stats);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ✅ BÚSQUEDA MEJORADA - Con useRef
  const handleSearch = (text: string) => {
    setSearchText(text);
    
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Crear nuevo timeout (700ms de delay)
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: text.trim() || undefined,
        page: 1
      }));
    }, 700) as unknown as number; // ✅ CAMBIO AQUÍ: casteo a number
  };

  // ✅ CLEANUP del timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = (key: keyof UsersFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'delete') => {
    try {
      if (action === 'suspend') {
        const result = await AdminUsersService.changeAccountStatus(userId, 'suspended', 'Suspensión por administrador');
        if (result.success) {
          Alert.alert('Éxito', 'Usuario suspendido');
          setRefreshing(true);
          loadData();
        }
      } else if (action === 'delete') {
        Alert.alert(
          'Confirmar eliminación',
          '¿Estás seguro de que quieres eliminar permanentemente este usuario?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: async () => {
                const result = await AdminUsersService.deleteUser(userId);
                if (result.success) {
                  Alert.alert('Éxito', 'Usuario eliminado');
                  setRefreshing(true);
                  loadData();
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo realizar la acción');
    }
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

  const renderUserItem = ({ item }: { item: AdminUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => router.push(`/(admin)/usuarios/${item.id}`)}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.userBadges}>
          <View style={[styles.badge, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.badgeText}>{item.role}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.accountStatus) }]}>
            <Text style={styles.badgeText}>{item.accountStatus}</Text>
          </View>
        </View>
      </View>

      <View style={styles.userDetails}>
        <View style={styles.verificationRow}>
          <Ionicons 
            name={item.isEmailVerified ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={item.isEmailVerified ? "#10B981" : "#EF4444"} 
          />
          <Text style={styles.verificationText}>Email</Text>
          
          <Ionicons 
            name={item.dniUploaded ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={item.dniUploaded ? "#10B981" : "#EF4444"} 
          />
          <Text style={styles.verificationText}>DNI</Text>
          
          <Ionicons 
            name={item.faceVerified ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={item.faceVerified ? "#10B981" : "#EF4444"} 
          />
          <Text style={styles.verificationText}>Rostro</Text>
        </View>

        <Text style={styles.userMeta}>
          Creado: {new Date(item.createdAt).toLocaleDateString()} • 
          Último login: {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleDateString() : 'Nunca'}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.suspendButton]}
          onPress={() => handleUserAction(item.id, 'suspend')}
        >
          <Ionicons name="pause-circle" size={16} color="#FFFFFF" />
          <Text style={styles.actionText}>Suspender</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleUserAction(item.id, 'delete')}
        >
          <Ionicons name="trash" size={16} color="#FFFFFF" />
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>📊 Estadísticas de Usuarios</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.byRole.admin}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.verificationStatus.fullyVerified}</Text>
            <Text style={styles.statLabel}>Verificados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.premium.premium}</Text>
            <Text style={styles.statLabel}>Premium</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: '👥 Gestión de Usuarios',
          headerRight: () => (
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={24} color="#E50914" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8C8C8C" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor="#8C8C8C"
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {/* ✅ FILTROS SIMPLIFICADOS - Solo rol y estado */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterChip, !filters.role && !filters.accountStatus && styles.filterChipActive]}
          onPress={() => setFilters({ page: 1, limit: 20 })}
        >
          <Text style={[styles.filterChipText, !filters.role && !filters.accountStatus && styles.filterChipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, filters.role === 'user' && styles.filterChipActive]}
          onPress={() => handleFilterChange('role', 'user')}
        >
          <Text style={[styles.filterChipText, filters.role === 'user' && styles.filterChipTextActive]}>
            👤 Usuarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filters.role === 'admin' && styles.filterChipActive]}
          onPress={() => handleFilterChange('role', 'admin')}
        >
          <Text style={[styles.filterChipText, filters.role === 'admin' && styles.filterChipTextActive]}>
            👑 Admins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filters.accountStatus === 'active' && styles.filterChipActive]}
          onPress={() => handleFilterChange('accountStatus', 'active')}
        >
          <Text style={[styles.filterChipText, filters.accountStatus === 'active' && styles.filterChipTextActive]}>
            ✅ Activos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filters.accountStatus === 'suspended' && styles.filterChipActive]}
          onPress={() => handleFilterChange('accountStatus', 'suspended')}
        >
          <Text style={[styles.filterChipText, filters.accountStatus === 'suspended' && styles.filterChipTextActive]}>
            ⚠️ Suspendidos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      {renderStats()}

      {/* Lista de Usuarios */}
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#E50914"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#404040" />
            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
          </View>
        }
      />
    </SafeAreaView>
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
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    margin: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(16),
    color: '#FFFFFF',
  },
  filtersContainer: {
    paddingHorizontal: moderateScale(16),
    marginBottom: verticalScale(16),
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    backgroundColor: '#1A1A1A',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#333333',
    marginRight: moderateScale(8),
    marginBottom: verticalScale(8),
    minHeight: verticalScale(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  filterChipText: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: '#8C8C8C',
    textAlign: 'center',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: moderateScale(16),
    marginBottom: verticalScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#333333',
  },
  statsTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#E50914',
  },
  statLabel: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginTop: verticalScale(4),
  },
  listContent: {
    padding: moderateScale(16),
    paddingTop: 0,
  },
  userCard: {
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  userInfo: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  userName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  userEmail: {
    fontSize: moderateScale(13),
    color: '#8C8C8C',
  },
  userBadges: {
    flexDirection: 'row',
    gap: moderateScale(6),
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  badgeText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  userDetails: {
    marginBottom: verticalScale(12),
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    gap: moderateScale(8),
  },
  verificationText: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginRight: moderateScale(12),
  },
  userMeta: {
    fontSize: moderateScale(12),
    color: '#666666',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    gap: moderateScale(6),
  },
  suspendButton: {
    backgroundColor: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(64),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: '#8C8C8C',
    marginTop: verticalScale(12),
    textAlign: 'center',
  },
});