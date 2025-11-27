import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useRef } from 'react';
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
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import adminCandyProductsService, {
  CandyProduct,
  ProductStats,
  FiltrosProductos,
} from '@/services/adminCandyProductsService';

export default function CandyProductsList() {
  const [productos, setProductos] = useState<CandyProduct[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const isLoadingRef = useRef(false);

  // Filtros
  const [filtroActivo, setFiltroActivo] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>(
    'TODOS'
  );
  const [filtroStock, setFiltroStock] = useState<'TODOS' | 'SIN_STOCK' | 'BAJO_STOCK'>(
    'TODOS'
  );

  // Solo cargar al montar o al volver con useFocusEffect
  useFocusEffect(
    useCallback(() => {
      console.log('🍬 Pantalla de productos enfocada');
      loadData();
      
      return () => {
        console.log('🍬 Pantalla de productos desenfocada');
      };
    }, []) // ✅ Array vacío - solo al enfocar/desenfocar
  );

  // Cargar datos cuando cambien los filtros
  React.useEffect(() => {
    console.log('🔄 Filtros cambiados, recargando...');
    loadData();
  }, [filtroActivo, filtroStock]);

  const loadData = async () => {
    // ⛔ CRÍTICO: Evitar múltiples requests simultáneos
    if (isLoadingRef.current) {
      console.log('⚠️ Ya hay una carga en progreso, ignorando...');
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setLoadAttempts(prev => prev + 1);

      console.log('📊 Cargando productos y estadísticas...');

      // Cargar productos con filtros
      const filtros: FiltrosProductos = {};
      if (filtroActivo === 'ACTIVOS') filtros.activo = true;
      if (filtroActivo === 'INACTIVOS') filtros.activo = false;
      if (filtroStock === 'SIN_STOCK') filtros.sinStock = true;

      const [productosResult, statsResult] = await Promise.all([
        adminCandyProductsService.getProductos(filtros),
        adminCandyProductsService.getStats(),
      ]);

      if (productosResult.success && productosResult.data) {
        let productosData = productosResult.data.productos || [];

        // Filtro adicional para bajo stock (cliente)
        if (filtroStock === 'BAJO_STOCK') {
          productosData = productosData.filter((p) => p.stock > 0 && p.stock <= 10);
        }

        setProductos(productosData);
        console.log(`✅ ${productosData.length} productos cargados`);
      } else {
        console.error('❌ Error cargando productos:', productosResult.error);
        Alert.alert('Error', productosResult.error || 'No se pudieron cargar productos');
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data.data);
        console.log('✅ Estadísticas cargadas');
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      Alert.alert('Error', 'Error al cargar los productos');
    } finally {
      setIsLoading(false);
      setLoadAttempts(0);
      isLoadingRef.current = false;
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing || isLoadingRef.current) {
      console.log('⚠️ Refresh ya en progreso');
      return;
    }
    
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleToggleActivo = async (producto: CandyProduct) => {
    const nuevoEstado = !producto.activo;
    const mensaje = nuevoEstado
      ? '¿Activar este producto?'
      : '¿Desactivar este producto? Los clientes no podrán verlo.';

    Alert.alert('Confirmar', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            const result = await adminCandyProductsService.cambiarEstadoActivo(
              producto.id,
              nuevoEstado
            );

            if (result.success) {
              Alert.alert(
                'Éxito',
                `Producto ${nuevoEstado ? 'activado' : 'desactivado'}`
              );
              await loadData();
            } else {
              Alert.alert('Error', result.error || 'No se pudo cambiar el estado');
            }
          } catch (error) {
            Alert.alert('Error', 'Error al cambiar el estado');
          }
        },
      },
    ]);
  };

  const handleAjustarStock = (producto: CandyProduct) => {
    Alert.prompt(
      'Ajustar Stock',
      `Stock actual: ${producto.stock}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: async (nuevoStock) => {
            const stockNum = parseInt(nuevoStock || '0', 10);
            if (isNaN(stockNum) || stockNum < 0) {
              Alert.alert('Error', 'Stock inválido');
              return;
            }

            try {
              const result = await adminCandyProductsService.ajustarStock(
                producto.id,
                stockNum,
                'Ajuste manual desde app'
              );

              if (result.success) {
                Alert.alert('Éxito', 'Stock actualizado correctamente');
                await loadData();
              } else {
                Alert.alert('Error', result.error || 'No se pudo ajustar el stock');
              }
            } catch (error) {
              Alert.alert('Error', 'Error al ajustar el stock');
            }
          },
        },
      ],
      'plain-text',
      String(producto.stock)
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return '#F44336';
    if (stock <= 10) return '#FF9800';
    return '#4CAF50';
  };

  if (isLoading && productos.length === 0) {
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#E50914"
          />
        }
      >
        {/* Estadísticas */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>📊 Estadísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  {stats.activos}
                </Text>
                <Text style={styles.statLabel}>Activos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#8C8C8C' }]}>
                  {stats.inactivos}
                </Text>
                <Text style={styles.statLabel}>Inactivos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#F44336' }]}>
                  {stats.sinStock}
                </Text>
                <Text style={styles.statLabel}>Sin Stock</Text>
              </View>
            </View>
          </View>
        )}

        {/* Filtros */}
        <View style={styles.filtersSection}>
          <Text style={styles.filtersTitle}>Filtros</Text>

          <Text style={styles.filterLabel}>Estado:</Text>
          <View style={styles.filterButtons}>
            {(['TODOS', 'ACTIVOS', 'INACTIVOS'] as const).map((estado) => (
              <TouchableOpacity
                key={estado}
                style={[
                  styles.filterButton,
                  filtroActivo === estado && styles.filterButtonActive,
                ]}
                onPress={() => {
                  console.log(`🔘 Filtro activo: ${estado}`);
                  setFiltroActivo(estado);
                }}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filtroActivo === estado && styles.filterButtonTextActive,
                  ]}
                >
                  {estado}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Stock:</Text>
          <View style={styles.filterButtons}>
            {(['TODOS', 'SIN_STOCK', 'BAJO_STOCK'] as const).map((stock) => (
              <TouchableOpacity
                key={stock}
                style={[
                  styles.filterButton,
                  filtroStock === stock && styles.filterButtonActive,
                ]}
                onPress={() => {
                  console.log(`🔘 Filtro stock: ${stock}`);
                  setFiltroStock(stock);
                }}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filtroStock === stock && styles.filterButtonTextActive,
                  ]}
                >
                  {stock === 'SIN_STOCK'
                    ? 'Sin Stock'
                    : stock === 'BAJO_STOCK'
                    ? 'Bajo Stock'
                    : 'Todos'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lista de productos */}
        <View style={styles.productsContainer}>
          <View style={styles.productsHeader}>
            <Text style={styles.productsTitle}>🍬 Productos ({productos.length})</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() =>
                Alert.alert(
                  'Próximamente',
                  'Creación de productos en desarrollo. Por ahora usa Firebase Console.'
                )
              }
            >
              <Text style={styles.createButtonText}>+ Crear</Text>
            </TouchableOpacity>
          </View>

          {productos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No hay productos con estos filtros</Text>
            </View>
          ) : (
            productos.map((producto) => (
              <View key={producto.id} style={styles.productCard}>
                {/* Header */}
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{producto.nombre}</Text>
                  <TouchableOpacity
                    style={[
                      styles.activeBadge,
                      { backgroundColor: producto.activo ? '#4CAF50' : '#8C8C8C' },
                    ]}
                    onPress={() => handleToggleActivo(producto)}
                  >
                    <Text style={styles.activeBadgeText}>
                      {producto.activo ? '✅ Activo' : '❌ Inactivo'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Descripción */}
                <Text style={styles.productDescription}>{producto.descripcion}</Text>

                {/* Info */}
                <View style={styles.productInfo}>
                  <Text style={styles.productInfoText}>
                    📁 {producto.categoria} • 🏷️ {producto.tipo}
                  </Text>
                </View>

                {/* Precios */}
                <View style={styles.pricesRow}>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Chico</Text>
                    <Text style={styles.priceValue}>
                      {formatCurrency(producto.precios.chico)}
                    </Text>
                  </View>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Mediano</Text>
                    <Text style={styles.priceValue}>
                      {formatCurrency(producto.precios.mediano)}
                    </Text>
                  </View>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Grande</Text>
                    <Text style={styles.priceValue}>
                      {formatCurrency(producto.precios.grande)}
                    </Text>
                  </View>
                </View>

                {/* Stock */}
                <View style={styles.stockRow}>
                  <View
                    style={[
                      styles.stockBadge,
                      { backgroundColor: getStockColor(producto.stock) },
                    ]}
                  >
                    <Text style={styles.stockText}>
                      📦 Stock: {producto.stock}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => handleAjustarStock(producto)}
                  >
                    <Text style={styles.adjustButtonText}>Ajustar</Text>
                  </TouchableOpacity>
                </View>

                {/* Botón Ver Detalle */}
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => {
                    console.log(`🔍 Navegando a detalle: ${producto.id}`);
                    router.push(`/(admin)/candyProducts/${producto.id}`);
                  }}
                >
                  <Text style={styles.detailButtonText}>Ver Detalle →</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
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
  },
  statsSection: {
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
  },
  statsTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginTop: verticalScale(4),
  },
  filtersSection: {
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
  },
  filtersTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
  },
  filterLabel: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginBottom: verticalScale(8),
  },
  filterButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#404040',
  },
  filterButtonActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  filterButtonText: {
    color: '#8C8C8C',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  productsContainer: {
    marginBottom: verticalScale(20),
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  productsTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: moderateScale(40),
  },
  emptyIcon: {
    fontSize: moderateScale(64),
    marginBottom: verticalScale(16),
  },
  emptyText: {
    color: '#8C8C8C',
    fontSize: moderateScale(16),
  },
  productCard: {
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  productName: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    marginBottom: verticalScale(8),
  },
  productInfo: {
    marginBottom: verticalScale(12),
  },
  productInfoText: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
  },
  pricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: verticalScale(12),
    paddingVertical: verticalScale(8),
    backgroundColor: '#000000',
    borderRadius: moderateScale(8),
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },
  priceValue: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  stockBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
    fontWeight: 'bold',
  },
  adjustButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
  adjustButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  detailButton: {
    backgroundColor: '#404040',
    padding: verticalScale(10),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
});