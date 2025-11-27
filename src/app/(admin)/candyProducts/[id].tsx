import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import adminCandyProductsService, {
  CandyProduct,
  StockAudit,
} from '@/services/adminCandyProductsService';

export default function CandyProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [producto, setProducto] = useState<CandyProduct | null>(null);
  const [auditoria, setAuditoria] = useState<StockAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    if (id) {
      loadProducto();
    }
  }, [id]);

  const loadProducto = async () => {
    try {
      setIsLoading(true);
      const result = await adminCandyProductsService.getProducto(id);

      if (result.success && result.data) {
        setProducto(result.data);
        // Cargar auditoría
        const auditResult = await adminCandyProductsService.getAuditoria(id, 20);
        if (auditResult.success && auditResult.data) {
          setAuditoria(auditResult.data.historial);
        }
      } else {
        Alert.alert('Error', result.error || 'No se pudo cargar el producto');
        router.back();
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
      Alert.alert('Error', 'Error al cargar el producto');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActivo = async () => {
    if (!producto) return;

    const nuevoEstado = !producto.activo;
    const mensaje = nuevoEstado
      ? '¿Activar este producto?'
      : '¿Desactivar este producto? Los clientes no podrán verlo.';

    Alert.alert('Confirmar', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setIsProcessing(true);
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
              await loadProducto();
            } else {
              Alert.alert('Error', result.error || 'No se pudo cambiar el estado');
            }
          } catch (error) {
            Alert.alert('Error', 'Error al cambiar el estado');
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const handleAjustarStock = () => {
    if (!producto) return;

    Alert.prompt(
      'Ajustar Stock',
      `Stock actual: ${producto.stock}\nIngresa el nuevo stock:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: async (nuevoStock) => {
            const stockNum = parseInt(nuevoStock || '0', 10);
            if (isNaN(stockNum) || stockNum < 0) {
              Alert.alert('Error', 'Stock inválido. Debe ser un número >= 0');
              return;
            }

            // Pedir razón del ajuste
            Alert.prompt(
              'Razón del Ajuste',
              'Ingresa la razón del cambio (opcional):',
              [
                { text: 'Omitir', style: 'cancel', onPress: () => ejecutarAjuste(stockNum) },
                {
                  text: 'Guardar',
                  onPress: (razon) => ejecutarAjuste(stockNum, razon),
                },
              ],
              'plain-text'
            );
          },
        },
      ],
      'plain-text',
      String(producto.stock)
    );
  };

  const ejecutarAjuste = async (nuevoStock: number, razon?: string) => {
    if (!producto) return;

    setIsProcessing(true);
    try {
      const result = await adminCandyProductsService.ajustarStock(
        producto.id,
        nuevoStock,
        razon || 'Ajuste manual desde app'
      );

      if (result.success && result.data) {
        Alert.alert(
          'Stock Actualizado',
          `${producto.nombre}\n` +
            `Stock anterior: ${result.data.stockAnterior}\n` +
            `Stock nuevo: ${result.data.stockNuevo}\n` +
            `Diferencia: ${result.data.diferencia > 0 ? '+' : ''}${result.data.diferencia}`
        );
        await loadProducto();
      } else {
        Alert.alert('Error', result.error || 'No se pudo ajustar el stock');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al ajustar el stock');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEliminar = () => {
    if (!producto) return;

    Alert.alert(
      '⚠️ ELIMINAR PERMANENTEMENTE',
      `¿Estás SEGURO de eliminar "${producto.nombre}"?\n\n` +
        '⚠️ Esta acción NO SE PUEDE DESHACER\n' +
        '⚠️ Si el producto tiene órdenes asociadas, NO se eliminará',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'ELIMINAR',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const result = await adminCandyProductsService.eliminarProducto(producto.id);

              if (result.success) {
                Alert.alert('Eliminado', 'Producto eliminado permanentemente');
                router.back();
              } else {
                Alert.alert('Error', result.error || 'No se pudo eliminar');
              }
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar el producto');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!producto) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Producto no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.productName}>{producto.nombre}</Text>
              <Text style={styles.productId}>ID: {producto.id}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.statusBadge,
                { backgroundColor: producto.activo ? '#4CAF50' : '#8C8C8C' },
              ]}
              onPress={handleToggleActivo}
              disabled={isProcessing}
            >
              <Text style={styles.statusBadgeText}>
                {producto.activo ? '✅ Activo' : '❌ Inactivo'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.productDescription}>{producto.descripcion}</Text>
        </View>

        {/* Información básica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Información</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Categoría:</Text>
            <Text style={styles.infoValue}>{producto.categoria}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo:</Text>
            <Text style={styles.infoValue}>{producto.tipo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Creado:</Text>
            <Text style={styles.infoValue}>
              {new Date(producto.creadoEn).toLocaleDateString('es-AR')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Actualizado:</Text>
            <Text style={styles.infoValue}>
              {new Date(producto.actualizadoEn).toLocaleDateString('es-AR')}
            </Text>
          </View>
        </View>

        {/* Precios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Precios</Text>
          <View style={styles.pricesGrid}>
            <View style={styles.priceCard}>
              <Text style={styles.priceSize}>Chico</Text>
              <Text style={styles.priceAmount}>
                {formatCurrency(producto.precios.chico)}
              </Text>
            </View>
            <View style={styles.priceCard}>
              <Text style={styles.priceSize}>Mediano</Text>
              <Text style={styles.priceAmount}>
                {formatCurrency(producto.precios.mediano)}
              </Text>
            </View>
            <View style={styles.priceCard}>
              <Text style={styles.priceSize}>Grande</Text>
              <Text style={styles.priceAmount}>
                {formatCurrency(producto.precios.grande)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stock */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📦 Stock</Text>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={handleAjustarStock}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.adjustButtonText}>Ajustar Stock</Text>
              )}
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.stockBadgeLarge,
              { backgroundColor: getStockColor(producto.stock) },
            ]}
          >
            <Text style={styles.stockValueLarge}>{producto.stock}</Text>
            <Text style={styles.stockLabelLarge}>unidades disponibles</Text>
          </View>
        </View>

        {/* Auditoría de Stock */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.auditHeader}
            onPress={() => setShowAudit(!showAudit)}
          >
            <Text style={styles.sectionTitle}>
              📊 Historial de Cambios ({auditoria.length})
            </Text>
            <Text style={styles.auditToggle}>{showAudit ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {showAudit && auditoria.length > 0 && (
            <View style={styles.auditList}>
              {auditoria.map((item) => (
                <View key={item.id} style={styles.auditItem}>
                  <View style={styles.auditItemHeader}>
                    <Text style={styles.auditDate}>
                      {new Date(item.updatedAt).toLocaleDateString('es-AR')}
                    </Text>
                    <View
                      style={[
                        styles.auditDiff,
                        {
                          backgroundColor:
                            item.diferencia > 0
                              ? '#4CAF50'
                              : item.diferencia < 0
                              ? '#F44336'
                              : '#8C8C8C',
                        },
                      ]}
                    >
                      <Text style={styles.auditDiffText}>
                        {item.diferencia > 0 ? '+' : ''}
                        {item.diferencia}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.auditStock}>
                    {item.stockAnterior} → {item.stockNuevo}
                  </Text>
                  <Text style={styles.auditReason}>{item.razon}</Text>
                </View>
              ))}
            </View>
          )}

          {showAudit && auditoria.length === 0 && (
            <Text style={styles.auditEmpty}>No hay cambios registrados</Text>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>⚙️ Acciones</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() =>
              Alert.alert('Próximamente', 'Edición de productos en desarrollo')
            }
          >
            <Text style={styles.actionButtonText}>✏️ Editar Producto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleEliminar}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>🗑️ Eliminar Producto</Text>
            )}
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: moderateScale(16),
    paddingBottom: verticalScale(40),
  },
  header: {
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  headerLeft: {
    flex: 1,
  },
  productName: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  productId: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    lineHeight: moderateScale(20),
  },
  section: {
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  infoLabel: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
  },
  infoValue: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  pricesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#000000',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  priceSize: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },
  priceAmount: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  adjustButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(6),
    minWidth: moderateScale(110),
    alignItems: 'center',
  },
  adjustButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  stockBadgeLarge: {
    padding: moderateScale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  stockValueLarge: {
    fontSize: moderateScale(48),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stockLabelLarge: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    marginTop: verticalScale(4),
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditToggle: {
    fontSize: moderateScale(18),
    color: '#FFFFFF',
  },
  auditList: {
    marginTop: verticalScale(12),
    gap: verticalScale(8),
  },
  auditItem: {
    backgroundColor: '#000000',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  auditItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  auditDate: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
  },
  auditDiff: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(4),
  },
  auditDiffText: {
    fontSize: moderateScale(12),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  auditStock: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  auditReason: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    fontStyle: 'italic',
  },
  auditEmpty: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    textAlign: 'center',
    marginTop: verticalScale(12),
  },
  actionsSection: {
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  actionButton: {
    padding: verticalScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  actionButtonPrimary: {
    backgroundColor: '#2196F3',
  },
  actionButtonDanger: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
});