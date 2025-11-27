import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
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
  TextInput,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import adminCandyOrdersService, {
  CandyOrder,
  CandyPaymentStatus,
  CandyRedeemStatus,
  FiltrosOrdenes,
} from '@/services/adminCandyOrdersService';
import { exportToCSV, formatCandyOrdersForCSV } from '@/utils/csvExport';

export default function CandyOrdersList() {
  const [ordenes, setOrdenes] = useState<CandyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  
  // Filtros
  const [filtroPaymentStatus, setFiltroPaymentStatus] = useState<CandyPaymentStatus | 'TODOS'>('TODOS');
  const [filtroRedeemStatus, setFiltroRedeemStatus] = useState<CandyRedeemStatus | 'TODOS'>('TODOS');

  useFocusEffect(
  useCallback(() => {
    loadOrdenes();
  }, [filtroPaymentStatus, filtroRedeemStatus])
);

  const loadOrdenes = async () => {
    try {
      setIsLoading(true);
      
      const filtros: FiltrosOrdenes = {};
      if (filtroPaymentStatus !== 'TODOS') {
        filtros.paymentStatus = filtroPaymentStatus;
      }
      if (filtroRedeemStatus !== 'TODOS') {
        filtros.redeemStatus = filtroRedeemStatus;
      }

      const result = await adminCandyOrdersService.getOrdenes(filtros);
      
      if (result.success && result.data) {
        setOrdenes(result.data.ordenes || []);
      } else {
        Alert.alert('Error', result.error || 'No se pudieron cargar los pedidos');
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      Alert.alert('Error', 'Error al cargar los pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrdenes();
    setIsRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      Alert.alert('Error', 'Ingresa un código de canje');
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminCandyOrdersService.buscarPorCodigo(searchCode.trim());
      
      if (result.success && result.data?.orden) {
        router.push(`/(admin)/candyOrders/${result.data.orden.id}`);
      } else {
        Alert.alert('No encontrado', 'No se encontró ningún pedido con ese código');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo buscar el pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (ordenes.length === 0) {
      Alert.alert('Error', 'No hay pedidos para exportar');
      return;
    }

    setIsExporting(true);
    try {
      const csvData = formatCandyOrdersForCSV(ordenes);
      const timestamp = new Date().toISOString().split('T')[0];
      await exportToCSV(csvData, `pedidos-golosinas-${timestamp}`);
      Alert.alert('Éxito', 'Pedidos exportados correctamente');
    } catch (error) {
      console.error('Error exportando:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getPaymentStatusColor = (status: CandyPaymentStatus) => {
    switch (status) {
      case 'PAGADO': return '#4CAF50';
      case 'PENDIENTE': return '#FF9800';
      case 'CANCELADO': return '#F44336';
      default: return '#8C8C8C';
    }
  };

  const getRedeemStatusColor = (status: CandyRedeemStatus) => {
    switch (status) {
      case 'CANJEADO': return '#4CAF50';
      case 'PENDIENTE': return '#2196F3';
      default: return '#8C8C8C';
    }
  };

  if (isLoading && ordenes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
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
        {/* Búsqueda por código */}
        <View style={styles.searchSection}>
          <Text style={styles.searchTitle}>🔍 Buscar por Código</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Ingresa código de canje"
              placeholderTextColor="#8C8C8C"
              value={searchCode}
              onChangeText={setSearchCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={isLoading}
            >
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filtersSection}>
          <Text style={styles.filtersTitle}>Filtros</Text>
          
          <Text style={styles.filterLabel}>Estado de Pago:</Text>
          <View style={styles.filterButtons}>
            {(['TODOS', 'PAGADO', 'PENDIENTE', 'CANCELADO'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filtroPaymentStatus === status && styles.filterButtonActive,
                ]}
                onPress={() => setFiltroPaymentStatus(status)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filtroPaymentStatus === status && styles.filterButtonTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Estado de Canje:</Text>
          <View style={styles.filterButtons}>
            {(['TODOS', 'PENDIENTE', 'CANJEADO'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filtroRedeemStatus === status && styles.filterButtonActive,
                ]}
                onPress={() => setFiltroRedeemStatus(status)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filtroRedeemStatus === status && styles.filterButtonTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botón exportar */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExport}
          disabled={isExporting || ordenes.length === 0}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.exportButtonText}>📊 Exportar a CSV ({ordenes.length})</Text>
          )}
        </TouchableOpacity>

        {/* Lista de pedidos */}
        <View style={styles.ordersContainer}>
          <Text style={styles.ordersTitle}>
            📦 Pedidos ({ordenes.length})
          </Text>
          
          {ordenes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍿</Text>
              <Text style={styles.emptyText}>No hay pedidos con estos filtros</Text>
            </View>
          ) : (
            ordenes.map((orden) => (
              <TouchableOpacity
                key={orden.id}
                style={styles.orderCard}
                onPress={() => router.push(`/(admin)/candyOrders/${orden.id}`)}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderCode}>{orden.redeemCode}</Text>
                  <Text style={styles.orderTotal}>{formatCurrency(orden.total)}</Text>
                </View>

                <View style={styles.orderInfo}>
                  <Text style={styles.orderInfoText}>
                    📅 {new Date(orden.createdAt).toLocaleDateString('es-AR')}
                  </Text>
                  <Text style={styles.orderInfoText}>
                    🛒 {orden.items.length} {orden.items.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                <View style={styles.orderStatus}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getPaymentStatusColor(orden.paymentStatus) },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{orden.paymentStatus}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getRedeemStatusColor(orden.redeemStatus) },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{orden.redeemStatus}</Text>
                  </View>
                </View>
              </TouchableOpacity>
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
  searchSection: {
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
  },
  searchTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
  },
  searchRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#404040',
  },
  searchButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: moderateScale(20),
    justifyContent: 'center',
    borderRadius: moderateScale(8),
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  exportButton: {
    backgroundColor: '#E50914',
    padding: verticalScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  ordersContainer: {
    marginBottom: verticalScale(20),
  },
  ordersTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(16),
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
  orderCard: {
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  orderCode: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderTotal: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderInfo: {
    flexDirection: 'row',
    marginBottom: verticalScale(8),
    gap: moderateScale(16),
  },
  orderInfoText: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
  },
  orderStatus: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(4),
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: 'bold',
  },
});