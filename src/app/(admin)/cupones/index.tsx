// app/(admin)/cupones/index.tsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  FlatList,
  SafeAreaView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { adminCouponService } from '../../../services/adminCouponService';
import { Coupon, CouponScope, CouponMode } from '../../../types/coupon';
import { enhanceCouponForFrontend, formatCouponValue, getCouponDescription } from '../../../utils/couponUtils';
import StatCard from '../../../components/StatCard';

interface CouponStats {
  total: number;
  activos: number;
  inactivos: number;
  porScope: Record<CouponScope, number>;
  porModo: Record<CouponMode, number>;
  premiumOnly: number;
  expirados: number;
  proximosAExpirar: number;
}

export default function CuponesAdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [cupones, setCupones] = useState<Coupon[]>([]);
  const [filtroActivo, setFiltroActivo] = useState<'all' | 'active' | 'inactive'>('all');
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setError(null);
      console.log('🔄 Iniciando carga de datos de cupones...');
      
      const [estadisticas, listaCupones] = await Promise.all([
        adminCouponService.obtenerEstadisticasCupones(),
        adminCouponService.obtenerTodosLosCupones()
      ]);
      
      console.log('📊 Estadísticas cargadas:', estadisticas);
      console.log('🏷️ Lista de cupones cargada:', {
        message: listaCupones.message,
        cuponesCount: listaCupones.data.length,
        pagination: listaCupones.pagination
      });
      
      setStats(estadisticas);
      setCupones(listaCupones.data);
      
      console.log('✅ Datos cargados exitosamente');
      
    } catch (err: any) {
      console.error('❌ Error cargando datos:', err);
      setError(err.message || 'Error al cargar los datos');
      
      // Establecer valores por defecto en caso de error
      setStats({
        total: 0,
        activos: 0,
        inactivos: 0,
        porScope: { tickets: 0, candyshop: 0, both: 0 },
        porModo: { fixed: 0, percent: 0, '2x1': 0, '3x2': 0 },
        premiumOnly: 0,
        expirados: 0,
        proximosAExpirar: 0
      });
      setCupones([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrar cupones
  const cuponesFiltrados = cupones.filter(cupon => {
    // Filtro por estado activo/inactivo
    if (filtroActivo === 'active' && !cupon.active) return false;
    if (filtroActivo === 'inactive' && cupon.active) return false;
    
    // Filtro por búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      return (
        cupon.code.toLowerCase().includes(busquedaLower) ||
        (cupon.scope && cupon.scope.toLowerCase().includes(busquedaLower)) ||
        (cupon.mode && cupon.mode.toLowerCase().includes(busquedaLower))
      );
    }
    
    return true;
  });

  // Manejar activar/desactivar cupón
  const handleToggleCupon = async (cuponId: string, codigo: string) => {
    try {
      const resultado = await adminCouponService.toggleActivarCupon(cuponId);
      
      // Actualizar lista local
      setCupones(prev => prev.map(cupon => 
        cupon.id === cuponId 
          ? { ...cupon, active: resultado.active }
          : cupon
      ));
      
      // Actualizar stats
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          activos: resultado.active ? prev.activos + 1 : prev.activos - 1,
          inactivos: resultado.active ? prev.inactivos - 1 : prev.inactivos + 1
        } : null);
      }

      Alert.alert(
        'Éxito',
        `Cupón ${codigo} ${resultado.active ? 'activado' : 'desactivado'}`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al cambiar estado del cupón');
    }
  };

  // Manejar eliminar cupón
  const handleEliminarCupon = (cuponId: string, codigo: string) => {
    Alert.alert(
      'Eliminar Cupón',
      `¿Estás seguro de que quieres eliminar el cupón ${codigo}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await adminCouponService.eliminarCupon(cuponId);
              
              // Actualizar lista local
              setCupones(prev => prev.filter(cupon => cupon.id !== cuponId));
              
              // Actualizar stats
              if (stats) {
                setStats(prev => prev ? {
                  ...prev,
                  total: prev.total - 1,
                  activos: prev.activos - 1
                } : null);
              }

              Alert.alert('Éxito', `Cupón ${codigo} eliminado`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Error al eliminar cupón');
            }
          }
        }
      ]
    );
  };

  // Componente de Estadísticas
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>📊 Estadísticas de Cupones</Text>
      
      <View style={styles.statsGrid}>
        <StatCard
          title="Total"
          value={stats?.total || 0}
          icon="🏷️"
          color="#2196F3"
        />
        
        <StatCard
          title="Activos"
          value={stats?.activos || 0}
          icon="✅"
          color="#4CAF50"
        />
        
        <StatCard
          title="Inactivos"
          value={stats?.inactivos || 0}
          icon="❌"
          color="#F44336"
        />
        
        <StatCard
          title="Expirados"
          value={stats?.expirados || 0}
          icon="⏰"
          color="#FF9800"
        />
      </View>

      <View style={styles.statsDetails}>
        <Text style={styles.statsSubtitle}>Distribución por Tipo:</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statDetail}>🎫 Tickets: {stats?.porScope?.tickets || 0}</Text>
          <Text style={styles.statDetail}>🍿 Golosinas: {stats?.porScope?.candyshop || 0}</Text>
          <Text style={styles.statDetail}>🎯 Ambos: {stats?.porScope?.both || 0}</Text>
        </View>
      </View>
    </View>
  );

  // Componente de Filtros
  const renderFiltros = () => (
    <View style={styles.filtersContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Buscar por código, tipo..."
        value={busqueda}
        onChangeText={setBusqueda}
        placeholderTextColor="#8C8C8C"
      />
      
      <View style={styles.filterButtons}>
        {[
          { key: 'all', label: 'Todos', count: stats?.total },
          { key: 'active', label: 'Activos', count: stats?.activos },
          { key: 'inactive', label: 'Inactivos', count: stats?.inactivos }
        ].map((filtro) => (
          <TouchableOpacity
            key={filtro.key}
            style={[
              styles.filterButton,
              filtroActivo === filtro.key && styles.filterButtonActive
            ]}
            onPress={() => setFiltroActivo(filtro.key as any)}
          >
            <Text style={[
              styles.filterButtonText,
              filtroActivo === filtro.key && styles.filterButtonTextActive
            ]}>
              {filtro.label} ({filtro.count || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render item de cupón
  const renderCuponItem = ({ item }: { item: Coupon }) => {
    const cuponMejorado = enhanceCouponForFrontend(item);
    
    return (
      <TouchableOpacity 
        style={[
          styles.cuponCard,
          !item.active && styles.cuponCardInactive,
          cuponMejorado._isExpired && styles.cuponCardExpired
        ]}
        onPress={() => router.push(`/(admin)/cupones/${item.id}`)}
      >
        <View style={styles.cuponHeader}>
          <View style={styles.cuponCodeContainer}>
            <Text style={styles.cuponCode}>{item.code}</Text>
            {item.premiumOnly && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>⭐ Premium</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cuponActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleToggleCupon(item.id, item.code);
              }}
            >
              <Ionicons 
                name={item.active ? "pause-circle-outline" : "play-circle-outline"} 
                size={20} 
                color={item.active ? "#FF9800" : "#4CAF50"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEliminarCupon(item.id, item.code);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cuponBody}>
          <Text style={styles.cuponDescription}>
            {getCouponDescription(item)}
          </Text>
          
          <View style={styles.cuponDetails}>
            <Text style={styles.cuponDetail}>
              🎯 {item.scope === 'both' ? 'Tickets & Golosinas' : 
                  item.scope === 'tickets' ? 'Solo Tickets' : 'Solo Golosinas'}
            </Text>
            <Text style={styles.cuponDetail}>
              💰 {formatCouponValue(item)}
            </Text>
          </View>

          <View style={styles.cuponStatus}>
            <View style={[
              styles.statusBadge,
              item.active ? styles.statusActive : styles.statusInactive
            ]}>
              <Text style={styles.statusText}>
                {item.active ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
            
            {cuponMejorado._isExpired && (
              <View style={[styles.statusBadge, styles.statusExpired]}>
                <Text style={styles.statusText}>Expirado</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando cupones...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Error al cargar cupones</Text>
        <Text style={styles.errorDescription}>
          {error}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={cargarDatos}>
          <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Gestión de Cupones',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => router.push('/(admin)/cupones/bulk')}
              >
                <Ionicons name="duplicate-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => router.push('/(admin)/cupones/crear')}
              >
                <Ionicons name="add-circle-outline" size={24} color="#E50914" />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />

      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#E50914"
            />
          }
        >
          {stats && renderStats()}
          {renderFiltros()}

          <View style={styles.cuponesHeader}>
            <Text style={styles.cuponesTitle}>
              Cupones ({cuponesFiltrados.length})
            </Text>
          </View>

          <FlatList
            data={cuponesFiltrados}
            renderItem={renderCuponItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏷️</Text>
                <Text style={styles.emptyText}>
                  {busqueda ? 'No se encontraron cupones' : 'No hay cupones creados'}
                </Text>
                {!busqueda && (
                  <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => router.push('/(admin)/cupones/crear')}
                  >
                    <Text style={styles.createButtonText}>Crear Primer Cupón</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </>
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
    padding: 20,
    backgroundColor: '#000000',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#F44336',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDescription: {
    color: '#8C8C8C',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: moderateScale(16),
    paddingBottom: verticalScale(100),
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },

  // Estadísticas
  statsContainer: {
    backgroundColor: '#1A1A1A',
    marginBottom: verticalScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  statsTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(16),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    borderLeftWidth: 4,
    width: '48%',
  },
  statIcon: {
    fontSize: moderateScale(24),
    marginRight: moderateScale(8),
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },
  statValue: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statSubtitle: {
    fontSize: moderateScale(10),
    color: '#4CAF50',
    marginTop: verticalScale(2),
  },
  statsDetails: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: verticalScale(12),
  },
  statsSubtitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: verticalScale(8),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statDetail: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },

  // Filtros y búsqueda
  filtersContainer: {
    backgroundColor: '#1A1A1A',
    marginBottom: verticalScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  searchInput: {
    backgroundColor: '#000000',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    fontSize: moderateScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#333333',
    color: '#FFFFFF',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: '#000000',
    marginHorizontal: moderateScale(4),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  filterButtonActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  filterButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#8C8C8C',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  // Header de lista de cupones
  cuponesHeader: {
    marginBottom: verticalScale(12),
  },
  cuponesTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Tarjeta de cupón
  cuponCard: {
    backgroundColor: '#1A1A1A',
    marginBottom: verticalScale(12),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  cuponCardInactive: {
    borderLeftColor: '#F44336',
    opacity: 0.7,
  },
  cuponCardExpired: {
    borderLeftColor: '#FF9800',
  },
  cuponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  cuponCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  cuponCode: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: moderateScale(8),
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: moderateScale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  premiumText: {
    fontSize: moderateScale(10),
    fontWeight: 'bold',
    color: '#000000',
  },
  cuponActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: moderateScale(8),
    marginLeft: moderateScale(8),
  },
  cuponBody: {
    // Contenido del cuerpo del cupón
  },
  cuponDescription: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: verticalScale(8),
  },
  cuponDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  cuponDetail: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
  },
  cuponStatus: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(8),
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#F44336',
  },
  statusExpired: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Estados vacíos
  emptyContainer: {
    alignItems: 'center',
    padding: verticalScale(40),
    backgroundColor: '#1A1A1A',
    borderRadius: moderateScale(12),
    marginTop: verticalScale(20),
  },
  emptyIcon: {
    fontSize: moderateScale(64),
    marginBottom: verticalScale(16),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: '#8C8C8C',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  createButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: moderateScale(24),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: verticalScale(40),
  },
});