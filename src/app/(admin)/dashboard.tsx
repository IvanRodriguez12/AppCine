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
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useAuth } from '@/context/authContext';
import adminService, { DashboardMetrics } from '@/services/adminService';
import { exportToCSV, formatDashboardMetricsForCSV, formatVentasPorDiaForCSV } from '@/utils/csvExport';

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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const result = await adminService.getDashboardMetrics();
      
      if (result.success && result.data) {
        setMetrics(result.data);
      } else {
        Alert.alert('Error', result.error || 'No se pudieron cargar las métricas');
      }
    } catch (error) {
      console.error('Error cargando métricas:', error);
      Alert.alert('Error', 'Error al cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMetrics();
    setIsRefreshing(false);
  };

  const handleExportMetrics = async () => {
    if (!metrics) {
      Alert.alert('Error', 'No hay datos para exportar');
      return;
    }

    setIsExporting(true);
    try {
      const csvData = formatDashboardMetricsForCSV(metrics);
      const timestamp = new Date().toISOString().split('T')[0];
      await exportToCSV(csvData, `metricas-completas-${timestamp}`);
      Alert.alert('Éxito', 'Métricas exportadas correctamente');
    } catch (error) {
      console.error('Error exportando:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportVentasPorDia = async () => {
    if (!metrics?.periodos?.ultimosDias) {
      Alert.alert('Error', 'No hay datos de ventas por día');
      return;
    }

    setIsExporting(true);
    try {
      const csvData = formatVentasPorDiaForCSV(metrics.periodos.ultimosDias);
      const timestamp = new Date().toISOString().split('T')[0];
      await exportToCSV(csvData, `ventas-ultimos-7-dias-${timestamp}`);
      Alert.alert('Éxito', 'Ventas exportadas correctamente');
    } catch (error) {
      console.error('Error exportando:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo');
    } finally {
      setIsExporting(false);
    }
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

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const safeNumber = (value: number | undefined | null): number => {
    return value ?? 0;
  };

  const safeString = (value: string | undefined | null): string => {
    return value ?? 'N/A';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando métricas...</Text>
      </View>
    );
  }

  if (!metrics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Error al cargar métricas</Text>
          <Text style={styles.errorDescription}>
            No se pudieron obtener los datos del dashboard
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMetrics}>
            <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButtonError} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
            <Text style={styles.welcomeText}>
              Bienvenido, {user?.displayName || 'Admin'}
            </Text>
            <Text style={styles.roleText}>👑 Administrador</Text>
          </View>
        </View>

        {/* Botones de exportación - Ahora más visibles */}
        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>📊 Exportar Datos</Text>
          <View style={styles.exportButtonsRow}>
            <TouchableOpacity
              style={styles.exportButtonNew}
              onPress={handleExportMetrics}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.exportButtonIcon}>📊</Text>
                  <Text style={styles.exportButtonLabel}>Métricas Completas</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.exportButtonNew, { marginLeft: moderateScale(12) }]}
              onPress={handleExportVentasPorDia}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.exportButtonIcon}>📈</Text>
                  <Text style={styles.exportButtonLabel}>Ventas por Día</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 💰 VENTAS */}
        {metrics.ventas && (
          <>
            <Text style={styles.sectionTitle}>💰 Ventas</Text>
            <View style={styles.metricsContainer}>
              <StatCard
                title="Ventas Hoy"
                value={formatCurrency(metrics.ventas.totalHoy)}
                icon="📅"
                color="#4CAF50"
              />
              <StatCard
                title="Ventas Semana"
                value={formatCurrency(metrics.ventas.totalSemana)}
                icon="📆"
                color="#2196F3"
              />
              <StatCard
                title="Ventas Mes"
                value={formatCurrency(metrics.ventas.totalMes)}
                icon="📈"
                color="#9C27B0"
                subtitle={
                  metrics.periodos?.comparacionMesAnterior?.diferenciaPorcentaje !== undefined
                    ? `${metrics.periodos.comparacionMesAnterior.diferenciaPorcentaje > 0 ? '+' : ''}${metrics.periodos.comparacionMesAnterior.diferenciaPorcentaje.toFixed(1)}% vs mes anterior`
                    : undefined
                }
              />
              <StatCard
                title="Promedio por Orden"
                value={formatCurrency(metrics.ventas.promedioOrden)}
                icon="💳"
                color="#FF9800"
              />
              <StatCard
                title="Orden Más Alta"
                value={formatCurrency(metrics.ventas.ordenMasAlta)}
                icon="🏆"
                color="#F44336"
              />
            </View>
          </>
        )}

        {/* 📦 ÓRDENES */}
        {metrics.ordenes && (
          <>
            <Text style={styles.sectionTitle}>📦 Órdenes</Text>
            <View style={styles.metricsContainer}>
              <StatCard
                title="Pendientes"
                value={safeNumber(metrics.ordenes.pendientes)}
                icon="⏳"
                color="#FF9800"
              />
              <StatCard
                title="Canjeadas"
                value={safeNumber(metrics.ordenes.canjeadas)}
                icon="✅"
                color="#4CAF50"
              />
              <StatCard
                title="Canceladas"
                value={safeNumber(metrics.ordenes.canceladas)}
                icon="❌"
                color="#F44336"
              />
              <StatCard
                title="Tasa de Canje"
                value={`${safeNumber(metrics.ordenes.tasaCanje).toFixed(1)}%`}
                icon="📊"
                color="#2196F3"
              />
            </View>
          </>
        )}

        {/* 🍬 PRODUCTOS */}
        {metrics.productos && (
          <>
            <Text style={styles.sectionTitle}>🍬 Productos</Text>
            <View style={styles.metricsContainer}>
              <StatCard
                title="Productos Activos"
                value={safeNumber(metrics.productos.productosActivos)}
                icon="✅"
                color="#4CAF50"
              />
              <StatCard
                title="Sin Stock"
                value={safeNumber(metrics.productos.productosSinStock)}
                icon="⚠️"
                color="#F44336"
              />
              {metrics.productos.productoMasVendido && (
                <StatCard
                  title="Más Vendido"
                  value={safeString(metrics.productos.productoMasVendido.nombre)}
                  icon="🏆"
                  color="#FFD700"
                  subtitle={`${safeNumber(metrics.productos.productoMasVendido.cantidadVendida)} unidades`}
                />
              )}
            </View>
          </>
        )}

        {/* 👥 USUARIOS */}
        {metrics.usuarios && (
          <>
            <Text style={styles.sectionTitle}>👥 Usuarios</Text>
            <View style={styles.metricsContainer}>
              <StatCard
                title="Total Usuarios"
                value={safeNumber(metrics.usuarios.totalUsuarios)}
                icon="👤"
                color="#2196F3"
              />
              <StatCard
                title="Nuevos Hoy"
                value={safeNumber(metrics.usuarios.nuevosHoy)}
                icon="🆕"
                color="#4CAF50"
              />
              <StatCard
                title="Nuevos Esta Semana"
                value={safeNumber(metrics.usuarios.nuevosSemana)}
                icon="📅"
                color="#9C27B0"
              />
              <StatCard
                title="Con Compras"
                value={safeNumber(metrics.usuarios.conCompras)}
                icon="🛒"
                color="#FF9800"
              />
            </View>
          </>
        )}

        {/* Accesos rápidos */}
        <View style={styles.quickAccessContainer}>
          <Text style={styles.sectionTitle}>⚡ Acceso Rápido</Text>
          
          <TouchableOpacity
            style={styles.accessCard}
            onPress={() => Alert.alert('Próximamente', 'FASE 3: Gestión de Usuarios')}
          >
            <Text style={styles.accessIcon}>👥</Text>
            <View style={styles.accessContent}>
              <Text style={styles.accessTitle}>Gestión de Usuarios</Text>
              <Text style={styles.accessDescription}>Ver y administrar usuarios</Text>
            </View>
            <Text style={styles.accessArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accessCard}
            onPress={() => Alert.alert('Próximamente', 'FASE 4: Gestión de Pedidos')}
          >
            <Text style={styles.accessIcon}>🍿</Text>
            <View style={styles.accessContent}>
              <Text style={styles.accessTitle}>Pedidos</Text>
              <Text style={styles.accessDescription}>Gestionar pedidos de golosinas</Text>
            </View>
            <Text style={styles.accessArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accessCard}
            onPress={() => Alert.alert('Próximamente', 'FASE 5: Gestión de Productos')}
          >
            <Text style={styles.accessIcon}>🍬</Text>
            <View style={styles.accessContent}>
              <Text style={styles.accessTitle}>Productos</Text>
              <Text style={styles.accessDescription}>Administrar catálogo</Text>
            </View>
            <Text style={styles.accessArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Botón de logout - Con más espacio abajo */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Espaciado extra para los botones del sistema */}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButtonError: {
    backgroundColor: '#404040',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scrollContent: {
    padding: moderateScale(16),
    paddingBottom: verticalScale(100), 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(20),
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  roleText: {
    fontSize: moderateScale(14),
    color: '#E50914',
  },
  exportSection: {
    marginBottom: verticalScale(24),
    backgroundColor: '#1A1A1A',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  exportTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
  },
  exportButtonsRow: {
    flexDirection: 'row',
  },
  exportButtonNew: {
    flex: 1,
    backgroundColor: '#E50914',
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(60),
  },
  exportButtonIcon: {
    fontSize: moderateScale(24),
    marginBottom: verticalScale(4),
  },
  exportButtonLabel: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
    marginTop: verticalScale(16),
  },
  metricsContainer: {
    marginBottom: verticalScale(8),
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
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
  quickAccessContainer: {
    marginBottom: verticalScale(24),
    marginTop: verticalScale(16),
  },
  accessCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
    alignItems: 'center',
  },
  accessIcon: {
    fontSize: moderateScale(32),
    marginRight: moderateScale(16),
  },
  accessContent: {
    flex: 1,
  },
  accessTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  accessDescription: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
  },
  accessArrow: {
    fontSize: moderateScale(32),
    color: '#404040',
  },
  logoutButton: {
    backgroundColor: '#E50914',
    padding: verticalScale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(20),
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