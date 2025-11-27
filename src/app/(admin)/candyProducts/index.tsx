// app/(admin)/candyProducts/index.tsx
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useAuth } from '@/context/authContext';
import AdminCandyProductsService, { 
  CandyProduct, 
  ProductStats,
  FiltrosProductos 
} from '@/services/adminCandyProductsService';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const ProductCard = ({ product, onEdit, onToggleActive, onDelete }: {
  product: CandyProduct;
  onEdit: (product: CandyProduct) => void;
  onToggleActive: (product: CandyProduct) => void;
  onDelete: (product: CandyProduct) => void;
}) => (
  <View style={styles.productCard}>
    <View style={styles.productHeader}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.nombre}</Text>
        <View style={styles.productMeta}>
          <Text style={styles.productCategory}>{product.categoria}</Text>
          <Text style={styles.productType}>• {product.tipo}</Text>
        </View>
      </View>
      <View style={[
        styles.statusBadge,
        { backgroundColor: product.activo ? '#10B981' : '#EF4444' }
      ]}>
        <Text style={styles.statusText}>
          {product.activo ? 'Activo' : 'Inactivo'}
        </Text>
      </View>
    </View>

    <View style={styles.productDetails}>
      <View style={styles.stockSection}>
        <Text style={[
          styles.stockText,
          product.stock === 0 ? styles.stockZero : 
          product.stock <= 10 ? styles.stockLow : styles.stockNormal
        ]}>
          Stock: {product.stock} unidades
        </Text>
      </View>
      
      <View style={styles.pricesSection}>
        <Text style={styles.pricesTitle}>Precios:</Text>
        <View style={styles.pricesRow}>
          <Text style={styles.price}>Chico: ${product.precios.chico}</Text>
          <Text style={styles.price}>Mediano: ${product.precios.mediano}</Text>
          <Text style={styles.price}>Grande: ${product.precios.grande}</Text>
        </View>
      </View>
    </View>

    <View style={styles.actions}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.editButton]}
        onPress={() => onEdit(product)}
      >
        <Ionicons name="pencil" size={16} color="#FFFFFF" />
        <Text style={styles.actionText}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.actionButton, 
          product.activo ? styles.deactivateButton : styles.activateButton
        ]}
        onPress={() => onToggleActive(product)}
      >
        <Ionicons 
          name={product.activo ? "eye-off" : "eye"} 
          size={16} 
          color="#FFFFFF" 
        />
        <Text style={styles.actionText}>
          {product.activo ? 'Desactivar' : 'Activar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => onDelete(product)}
      >
        <Ionicons name="trash" size={16} color="#FFFFFF" />
        <Text style={styles.actionText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function CandyProductsScreen() {
  const { user, logout } = useAuth();
  const [productos, setProductos] = useState<CandyProduct[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosProductos>({});
  const [loadAttempts, setLoadAttempts] = useState(0);

  useEffect(() => {
    loadProducts();
  }, [filtros]);

  const loadProducts = async () => {
    if (isLoading && loadAttempts > 0) {
      console.log('⚠️ Carga ya en progreso, ignorando...');
      return;
    }

    try {
      setIsLoading(true);
      setLoadAttempts(prev => prev + 1);
      
      console.log('🍬 Cargando productos...');
      
      // Cargar productos
      const productosResult = await AdminCandyProductsService.getProductos(filtros);
      if (productosResult.success && productosResult.data) {
        setProductos(productosResult.data.productos);
        console.log(`✅ ${productosResult.data.productos.length} productos cargados`);
      }

      // Cargar estadísticas
      const statsResult = await AdminCandyProductsService.getStats();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data.data);
        console.log('📊 Estadísticas cargadas');
      }
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setIsLoading(false);
      setLoadAttempts(0);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await loadProducts();
    setIsRefreshing(false);
  };

  const handleToggleActive = async (producto: CandyProduct) => {
    try {
      const result = await AdminCandyProductsService.cambiarEstadoActivo(
        producto.id, 
        !producto.activo
      );
      
      if (result.success) {
        // Actualizar lista localmente
        setProductos(prev => 
          prev.map(p => 
            p.id === producto.id 
              ? { ...p, activo: !p.activo }
              : p
          )
        );
        
        Alert.alert(
          'Éxito', 
          `Producto ${!producto.activo ? 'activado' : 'desactivado'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado del producto');
    }
  };

  const handleDelete = (producto: CandyProduct) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de eliminar permanentemente "${producto.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AdminCandyProductsService.eliminarProducto(producto.id);
              if (result.success) {
                Alert.alert('Éxito', 'Producto eliminado permanentemente');
                loadProducts(); // Recargar lista
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  const handleEdit = (producto: CandyProduct) => {
    console.log('✏️ Editando producto:', producto.id);
    router.push(`/(admin)/candyProducts/${producto.id}`);
  };

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

  const navigateToCreate = () => {
    console.log('🆕 Navegando a crear producto...');
    router.push('/(admin)/candyProducts/crear');
  };

  const navigateToDashboard = () => {
    console.log('📊 Volviendo al dashboard...');
    router.push('/(admin)/dashboard');
  };

  const formatNumber = (value: number | undefined | null): string => {
    return value?.toString() || '0';
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#E50914"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={navigateToDashboard}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.welcomeText}>Gestión de Productos</Text>
              <Text style={styles.roleText}>🍬 Catálogo de Golosinas</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={navigateToCreate}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>🎯 Filtros</Text>
          <View style={styles.filtersRow}>
            <TouchableOpacity 
              style={[
                styles.filterButton,
                Object.keys(filtros).length === 0 && styles.filterButtonActive
              ]}
              onPress={() => setFiltros({})}
            >
              <Text style={styles.filterButtonText}>Todos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterButton,
                filtros.activo === true && styles.filterButtonActive
              ]}
              onPress={() => setFiltros({ activo: true })}
            >
              <Text style={styles.filterButtonText}>Activos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterButton,
                filtros.activo === false && styles.filterButtonActive
              ]}
              onPress={() => setFiltros({ activo: false })}
            >
              <Text style={styles.filterButtonText}>Inactivos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterButton,
                filtros.sinStock && styles.filterButtonActive
              ]}
              onPress={() => setFiltros({ sinStock: true })}
            >
              <Text style={styles.filterButtonText}>Sin Stock</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadísticas */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>📊 Estadísticas</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Productos"
                value={formatNumber(stats.total)}
                icon="📦"
                color="#3B82F6"
              />
              <StatCard
                title="Activos"
                value={formatNumber(stats.activos)}
                icon="✅"
                color="#10B981"
              />
              <StatCard
                title="Sin Stock"
                value={formatNumber(stats.sinStock)}
                icon="⚠️"
                color="#EF4444"
              />
              <StatCard
                title="Bajo Stock"
                value={formatNumber(stats.bajoStock)}
                icon="📉"
                color="#F59E0B"
              />
            </View>
          </View>
        )}

        {/* Lista de Productos */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🍬 Productos ({productos.length})</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={20} color="#E50914" />
            </TouchableOpacity>
          </View>

          {productos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#8C8C8C" />
              <Text style={styles.emptyTitle}>No hay productos</Text>
              <Text style={styles.emptyDescription}>
                {Object.keys(filtros).length > 0 
                  ? 'No se encontraron productos con los filtros aplicados'
                  : 'Crea tu primer producto para comenzar'
                }
              </Text>
              {Object.keys(filtros).length === 0 && (
                <TouchableOpacity 
                  style={styles.emptyActionButton}
                  onPress={navigateToCreate}
                >
                  <Text style={styles.emptyActionText}>Crear Primer Producto</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={productos}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Botón de logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  scrollContent: {
    padding: moderateScale(16),
    paddingBottom: verticalScale(100),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: moderateScale(12),
    padding: moderateScale(4),
  },
  welcomeText: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(2),
  },
  roleText: {
    fontSize: moderateScale(14),
    color: '#E50914',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E50914',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: moderateScale(4),
    fontSize: moderateScale(14),
  },
  filtersSection: {
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  filterButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#404040',
  },
  filterButtonActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  statsSection: {
    marginBottom: verticalScale(20),
  },
  statsGrid: {
    gap: verticalScale(12),
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderLeftWidth: 4,
  },
  statIcon: {
    fontSize: moderateScale(32),
    marginRight: moderateScale(16),
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },
  statValue: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statSubtitle: {
    fontSize: moderateScale(12),
    color: '#4CAF50',
    marginTop: verticalScale(4),
  },
  productsSection: {
    marginBottom: verticalScale(20),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  refreshButton: {
    padding: moderateScale(4),
  },
  productCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCategory: {
    fontSize: moderateScale(14),
    color: '#E50914',
    fontWeight: '500',
  },
  productType: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    marginLeft: moderateScale(4),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  productDetails: {
    marginBottom: verticalScale(12),
  },
  stockSection: {
    marginBottom: verticalScale(8),
  },
  stockText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  stockZero: {
    color: '#EF4444',
  },
  stockLow: {
    color: '#F59E0B',
  },
  stockNormal: {
    color: '#10B981',
  },
  pricesSection: {
    
  },
  pricesTitle: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },
  pricesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  price: {
    fontSize: moderateScale(14),
    color: '#10B981',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
    flex: 1,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  activateButton: {
    backgroundColor: '#10B981',
  },
  deactivateButton: {
    backgroundColor: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginLeft: moderateScale(4),
  },
  emptyState: {
    alignItems: 'center',
    padding: verticalScale(48),
    backgroundColor: '#1A1A1A',
    borderRadius: moderateScale(12),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  emptyDescription: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  emptyActionButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: moderateScale(24),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
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
  bottomSpacer: {
    height: verticalScale(40),
  },
});