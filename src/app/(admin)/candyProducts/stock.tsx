// app/(admin)/candyProducts/stock.tsx
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useAuth } from '@/context/authContext';
import AdminCandyProductsService, { 
  CandyProduct,
  BulkStockItem
} from '@/services/adminCandyProductsService';
import { Ionicons } from '@expo/vector-icons';

interface ProductoStock extends CandyProduct {
  nuevoStock: number;
  stockAnterior: number;
}

export default function AjusteStockMasivoScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<ProductoStock[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [razon, setRazon] = useState('Ajuste de inventario');
  const [productosModificados, setProductosModificados] = useState<Set<string>>(new Set());

  // Cargar productos al montar
  useEffect(() => {
    loadProductos();
  }, []);

  // Filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    if (busqueda.trim() === '') {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.tipo.toLowerCase().includes(busqueda.toLowerCase())
      );
      setProductosFiltrados(filtrados);
    }
  }, [busqueda, productos]);

  const loadProductos = async () => {
    try {
      setIsLoading(true);
      console.log('📦 Cargando productos para ajuste de stock...');
      
      const result = await AdminCandyProductsService.getProductos();
      
      if (result.success && result.data) {
        const productosConStock: ProductoStock[] = result.data.productos.map(producto => ({
          ...producto,
          nuevoStock: producto.stock,
          stockAnterior: producto.stock
        }));
        
        setProductos(productosConStock);
        setProductosFiltrados(productosConStock);
        console.log(`✅ ${productosConStock.length} productos cargados`);
      } else {
        throw new Error(result.error || 'Error al cargar productos');
      }
    } catch (error: any) {
      console.error('❌ Error cargando productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockChange = (productId: string, nuevoValor: string) => {
    const valorNumerico = nuevoValor === '' ? 0 : parseInt(nuevoValor) || 0;
    
    setProductos(prev => 
      prev.map(producto => {
        if (producto.id === productId) {
          const modificado = valorNumerico !== producto.stockAnterior;
          if (modificado) {
            productosModificados.add(productId);
          } else {
            productosModificados.delete(productId);
          }
          
          return {
            ...producto,
            nuevoStock: valorNumerico
          };
        }
        return producto;
      })
    );
  };

  const handleIncrement = (productId: string) => {
    setProductos(prev => 
      prev.map(producto => {
        if (producto.id === productId) {
          const nuevoStock = producto.nuevoStock + 1;
          productosModificados.add(productId);
          return { ...producto, nuevoStock };
        }
        return producto;
      })
    );
  };

  const handleDecrement = (productId: string) => {
    setProductos(prev => 
      prev.map(producto => {
        if (producto.id === productId && producto.nuevoStock > 0) {
          const nuevoStock = producto.nuevoStock - 1;
          productosModificados.add(productId);
          return { ...producto, nuevoStock };
        }
        return producto;
      })
    );
  };

  const handleSetAllStock = (valor: number) => {
    Alert.alert(
      `Establecer todo a ${valor}`,
      `¿Estás seguro de establecer el stock de TODOS los productos a ${valor}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Establecer', 
          style: 'destructive',
          onPress: () => {
            setProductos(prev => 
              prev.map(producto => {
                if (producto.stockAnterior !== valor) {
                  productosModificados.add(producto.id);
                }
                return { ...producto, nuevoStock: valor };
              })
            );
          }
        }
      ]
    );
  };

  const getProductosModificados = (): BulkStockItem[] => {
    return productos
      .filter(producto => producto.nuevoStock !== producto.stockAnterior)
      .map(producto => ({
        id: producto.id,
        stock: producto.nuevoStock
      }));
  };

  const hasChanges = (): boolean => {
    return productos.some(producto => producto.nuevoStock !== producto.stockAnterior);
  };

  const getResumenCambios = () => {
    const modificados = getProductosModificados();
    const totalActual = productos.reduce((sum, p) => sum + p.stockAnterior, 0);
    const totalNuevo = productos.reduce((sum, p) => sum + p.nuevoStock, 0);
    const diferencia = totalNuevo - totalActual;

    return {
      totalModificados: modificados.length,
      totalActual,
      totalNuevo,
      diferencia,
      tendencia: diferencia > 0 ? '📈' : diferencia < 0 ? '📉' : '➡️'
    };
  };

  const handleSubmit = async () => {
    const productosModificados = getProductosModificados();
    
    if (productosModificados.length === 0) {
      Alert.alert('Sin cambios', 'No hay productos con stock modificado');
      return;
    }

    if (!razon.trim()) {
      Alert.alert('Error', 'Por favor ingresa una razón para el ajuste de stock');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log(`📦 Enviando ajuste masivo de ${productosModificados.length} productos`);
      
      const result = await AdminCandyProductsService.ajustarStockMasivo(
        productosModificados,
        razon
      );
      
      if (result.success) {
        console.log('✅ Ajuste masivo completado exitosamente');
        
        const resumen = getResumenCambios();
        Alert.alert(
          '¡Éxito!', 
          `Stock de ${resumen.totalModificados} productos actualizado correctamente\n\n` +
          `Stock total: ${resumen.totalActual} → ${resumen.totalNuevo} ${resumen.tendencia}`,
          [
            {
              text: 'Volver a Productos',
              onPress: () => router.replace('/(admin)/candyProducts'),
            },
            {
              text: 'Seguir Ajustando',
              onPress: () => {
                // Recargar para obtener stocks actualizados
                loadProductos();
                setRazon('Ajuste de inventario');
              },
            },
          ]
        );
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('❌ Error en ajuste masivo:', error);
      Alert.alert(
        'Error', 
        error.message || 'No se pudo realizar el ajuste de stock. Intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (hasChanges()) {
      Alert.alert(
        '¿Salir sin guardar?',
        'Tienes cambios sin guardar en el stock. ¿Estás seguro de que quieres salir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Salir', 
            style: 'destructive',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const renderProducto = ({ item }: { item: ProductoStock }) => {
    const estaModificado = item.nuevoStock !== item.stockAnterior;
    const diferencia = item.nuevoStock - item.stockAnterior;

    return (
      <View style={[styles.productCard, estaModificado && styles.productCardModified]}>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.nombre}</Text>
            <View style={styles.productMeta}>
              <Text style={styles.productCategory}>{item.categoria}</Text>
              <Text style={styles.productType}>• {item.tipo}</Text>
              {!item.activo && (
                <Text style={styles.inactiveBadge}>• INACTIVO</Text>
              )}
            </View>
          </View>
          {estaModificado && (
            <View style={[
              styles.changeBadge,
              { backgroundColor: diferencia > 0 ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.changeBadgeText}>
                {diferencia > 0 ? '+' : ''}{diferencia}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.stockSection}>
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Stock actual:</Text>
            <Text style={styles.stockValue}>{item.stockAnterior}</Text>
          </View>
          
          <View style={styles.stockControls}>
            <TouchableOpacity 
              style={[styles.stockButton, styles.decrementButton]}
              onPress={() => handleDecrement(item.id)}
              disabled={item.nuevoStock <= 0}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TextInput
              style={[
                styles.stockInput,
                estaModificado && styles.stockInputModified
              ]}
              value={item.nuevoStock.toString()}
              onChangeText={(value) => handleStockChange(item.id, value)}
              keyboardType="numeric"
              selectTextOnFocus
            />
            
            <TouchableOpacity 
              style={[styles.stockButton, styles.incrementButton]}
              onPress={() => handleIncrement(item.id)}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {estaModificado && (
          <View style={styles.previewSection}>
            <Text style={styles.previewText}>
              {item.stockAnterior} → {item.nuevoStock} 
              <Text style={diferencia > 0 ? styles.previewPositive : styles.previewNegative}>
                {diferencia > 0 ? ` (+${diferencia})` : ` (${diferencia})`}
              </Text>
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  const resumen = getResumenCambios();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleGoBack}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.welcomeText}>Ajuste Masivo de Stock</Text>
              <Text style={styles.roleText}>📦 Actualización múltiple</Text>
            </View>
          </View>
          {hasChanges() && (
            <View style={styles.changesBadge}>
              <Text style={styles.changesBadgeText}>
                {resumen.totalModificados} modificados
              </Text>
            </View>
          )}
        </View>

        {/* Resumen de cambios */}
        {hasChanges() && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📊 Resumen de Cambios</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{resumen.totalModificados}</Text>
                <Text style={styles.summaryLabel}>Productos modificados</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{resumen.totalActual}</Text>
                <Text style={styles.summaryLabel}>Stock actual total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[
                  styles.summaryNumber,
                  { color: resumen.diferencia > 0 ? '#10B981' : resumen.diferencia < 0 ? '#EF4444' : '#FFFFFF' }
                ]}>
                  {resumen.totalNuevo}
                </Text>
                <Text style={styles.summaryLabel}>Stock nuevo total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[
                  styles.summaryNumber,
                  { color: resumen.diferencia > 0 ? '#10B981' : resumen.diferencia < 0 ? '#EF4444' : '#FFFFFF' }
                ]}>
                  {resumen.diferencia > 0 ? '+' : ''}{resumen.diferencia}
                </Text>
                <Text style={styles.summaryLabel}>Diferencia total</Text>
              </View>
            </View>
          </View>
        )}

        {/* Controles rápidos */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleSetAllStock(0)}
            >
              <Text style={styles.quickActionIcon}>❌</Text>
              <Text style={styles.quickActionText}>Stock 0</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleSetAllStock(10)}
            >
              <Text style={styles.quickActionIcon}>📦</Text>
              <Text style={styles.quickActionText}>Stock 10</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleSetAllStock(50)}
            >
              <Text style={styles.quickActionIcon}>🏪</Text>
              <Text style={styles.quickActionText}>Stock 50</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleSetAllStock(100)}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Stock 100</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Búsqueda y Razón */}
        <View style={styles.controlsSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8C8C8C" />
            <TextInput
              style={styles.searchInput}
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar productos..."
              placeholderTextColor="#8C8C8C"
            />
          </View>

          <View style={styles.reasonContainer}>
            <Text style={styles.inputLabel}>📝 Razón del ajuste</Text>
            <TextInput
              style={styles.reasonInput}
              value={razon}
              onChangeText={setRazon}
              placeholder="Ej: Ajuste de inventario, reposición..."
              placeholderTextColor="#8C8C8C"
            />
          </View>
        </View>

        {/* Lista de productos */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🍬 Productos ({productosFiltrados.length})
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadProductos}
            >
              <Ionicons name="refresh" size={20} color="#E50914" />
            </TouchableOpacity>
          </View>

          {productosFiltrados.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#8C8C8C" />
              <Text style={styles.emptyTitle}>No se encontraron productos</Text>
              <Text style={styles.emptyDescription}>
                {busqueda ? 'Intenta con otros términos de búsqueda' : 'No hay productos disponibles'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={productosFiltrados}
              renderItem={renderProducto}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleGoBack}
            disabled={isSubmitting}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.submitButton,
              (!hasChanges() || !razon.trim()) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !hasChanges() || !razon.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.actionButtonText}>
              {isSubmitting ? 'Procesando...' : `Aplicar (${resumen.totalModificados})`}
            </Text>
          </TouchableOpacity>
        </View>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: moderateScale(16),
    paddingBottom: verticalScale(100),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(24),
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
  changesBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(12),
  },
  changesBadgeText: {
    color: '#000000',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(20),
  },
  summaryTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(12),
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: moderateScale(80),
  },
  summaryNumber: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  summaryLabel: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: moderateScale(20),
    marginBottom: verticalScale(4),
  },
  quickActionText: {
    fontSize: moderateScale(12),
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  controlsSection: {
    marginBottom: verticalScale(20),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    marginBottom: verticalScale(12),
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    marginLeft: moderateScale(8),
  },
  reasonContainer: {
    marginBottom: verticalScale(12),
  },
  inputLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: verticalScale(8),
  },
  reasonInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    color: '#FFFFFF',
    fontSize: moderateScale(16),
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
  productCardModified: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
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
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  inactiveBadge: {
    fontSize: moderateScale(12),
    color: '#EF4444',
    fontWeight: 'bold',
    marginLeft: moderateScale(4),
  },
  changeBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  changeBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  stockSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockInfo: {
    flex: 1,
  },
  stockLabel: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },
  stockValue: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  stockButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  decrementButton: {
    backgroundColor: '#EF4444',
  },
  incrementButton: {
    backgroundColor: '#10B981',
  },
  stockInput: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: moderateScale(6),
    padding: moderateScale(8),
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: moderateScale(60),
  },
  stockInputModified: {
    borderColor: '#F59E0B',
    backgroundColor: '#2A1A00',
  },
  previewSection: {
    marginTop: verticalScale(8),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  previewText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  previewPositive: {
    color: '#10B981',
  },
  previewNegative: {
    color: '#EF4444',
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
  },
  actionsSection: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: verticalScale(20),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: verticalScale(16),
    borderRadius: moderateScale(8),
    gap: moderateScale(8),
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#E50914',
  },
  submitButtonDisabled: {
    backgroundColor: '#404040',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: verticalScale(40),
  },
});