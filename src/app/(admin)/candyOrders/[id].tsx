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
  Linking,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import adminCandyOrdersService, {
  CandyOrderDetalle,
  CandyPaymentStatus,
  CandyRedeemStatus,
} from '@/services/adminCandyOrdersService';
import { exportToCSV, formatCandyOrderItemsForCSV } from '@/utils/csvExport';

export default function CandyOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [orden, setOrden] = useState<CandyOrderDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrdenDetalle();
    }
  }, [id]);

  const loadOrdenDetalle = async () => {
    try {
      setIsLoading(true);
      const result = await adminCandyOrdersService.getDetalleOrden(id);
      
      if (result.success && result.data?.orden) {
        setOrden(result.data.orden);
      } else {
        Alert.alert('Error', result.error || 'No se pudo cargar el pedido');
        router.back();
      }
    } catch (error) {
      console.error('Error cargando pedido:', error);
      Alert.alert('Error', 'Error al cargar el pedido');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarEstadoCanje = async (nuevoEstado: CandyRedeemStatus) => {
    if (!orden) return;

    const mensaje = nuevoEstado === 'CANJEADO' 
      ? '¿Marcar este pedido como CANJEADO?'
      : '¿Regresar este pedido a PENDIENTE?';

    Alert.alert(
      'Confirmar Acción',
      mensaje,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const result = await adminCandyOrdersService.cambiarEstadoCanje(
                orden.id,
                nuevoEstado
              );

              if (result.success) {
                Alert.alert('Éxito', 'Estado de canje actualizado');
                await loadOrdenDetalle();
              } else {
                Alert.alert('Error', result.error || 'No se pudo actualizar el estado');
              }
            } catch (error) {
              Alert.alert('Error', 'Error al cambiar el estado');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelarOrden = async () => {
    if (!orden) return;

    if (orden.redeemStatus === 'CANJEADO') {
      Alert.alert('Error', 'No se puede cancelar un pedido ya canjeado');
      return;
    }

    Alert.alert(
      'Cancelar Pedido',
      '¿Estás seguro? Se restaurará el stock de los productos.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const result = await adminCandyOrdersService.cancelarOrden(
                orden.id,
                'Cancelado por administrador'
              );

              if (result.success) {
                Alert.alert('Pedido Cancelado', 'El pedido ha sido cancelado y el stock restaurado');
                await loadOrdenDetalle();
              } else {
                Alert.alert('Error', result.error || 'No se pudo cancelar el pedido');
              }
            } catch (error) {
              Alert.alert('Error', 'Error al cancelar el pedido');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleExportItems = async () => {
    if (!orden) return;

    try {
      const csvData = formatCandyOrderItemsForCSV(orden);
      await exportToCSV(csvData, `items-pedido-${orden.redeemCode}`);
      Alert.alert('Éxito', 'Items exportados correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar los items');
    }
  };

  const handleContactUser = () => {
    if (!orden?.usuario?.phone) {
      Alert.alert('Error', 'No hay teléfono disponible');
      return;
    }

    const phoneNumber = orden.usuario.phone.replace(/\D/g, '');
    const message = `Hola! Te contactamos sobre tu pedido ${orden.redeemCode}`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGADO': return '#4CAF50';
      case 'PENDIENTE': return '#FF9800';
      case 'CANCELADO': return '#F44336';
      case 'CANJEADO': return '#4CAF50';
      default: return '#8C8C8C';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando pedido...</Text>
      </View>
    );
  }

  if (!orden) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pedido no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header con código de canje */}
        <View style={styles.header}>
          <Text style={styles.codeLabel}>Código de Canje</Text>
          <Text style={styles.code}>{orden.redeemCode}</Text>
          <Text style={styles.orderId}>ID: {orden.id}</Text>
        </View>

        {/* Estados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estados</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Pago:</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(orden.paymentStatus) },
                ]}
              >
                <Text style={styles.statusBadgeText}>{orden.paymentStatus}</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Canje:</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(orden.redeemStatus) },
                ]}
              >
                <Text style={styles.statusBadgeText}>{orden.redeemStatus}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Información del cliente */}
        {orden.usuario && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Cliente</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{orden.usuario.displayName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{orden.usuario.email}</Text>
            </View>
            {orden.usuario.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{orden.usuario.phone}</Text>
              </View>
            )}
            {orden.usuario.phone && (
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={handleContactUser}
              >
                <Text style={styles.whatsappButtonText}>📱 Contactar por WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Items del pedido */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛒 Items ({orden.items.length})</Text>
            <TouchableOpacity
              style={styles.exportSmallButton}
              onPress={handleExportItems}
            >
              <Text style={styles.exportSmallButtonText}>📊 CSV</Text>
            </TouchableOpacity>
          </View>

          {orden.productosDetalle.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.nombre}</Text>
                <Text style={styles.itemTotal}>{formatCurrency(item.subtotal)}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemDetail}>Tamaño: {item.tamanio}</Text>
                <Text style={styles.itemDetail}>Cantidad: {item.cantidad}</Text>
                <Text style={styles.itemDetail}>
                  Precio unitario: {formatCurrency(item.precioUnitario)}
                </Text>
                <Text style={styles.itemDetail}>
                  Stock actual: {item.stockActual}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Resumen de pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Resumen</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(orden.subtotal)}</Text>
          </View>
          {orden.descuento > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Descuento:</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                -{formatCurrency(orden.descuento)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fee de Servicio:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(orden.feeServicio)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabelTotal}>TOTAL:</Text>
            <Text style={styles.summaryValueTotal}>{formatCurrency(orden.total)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Método de Pago:</Text>
            <Text style={styles.summaryValue}>
              {orden.paymentMethod === 'mercadopago' ? '💳 Mercado Pago' : '💵 Efectivo'}
            </Text>
          </View>
        </View>

        {/* Fechas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Fechas</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Creado:</Text>
            <Text style={styles.infoValue}>
              {new Date(orden.createdAt).toLocaleString('es-AR')}
            </Text>
          </View>
          {orden.redeemedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Canjeado:</Text>
              <Text style={styles.infoValue}>
                {new Date(orden.redeemedAt).toLocaleString('es-AR')}
              </Text>
            </View>
          )}
          {orden.canceledAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cancelado:</Text>
              <Text style={styles.infoValue}>
                {new Date(orden.canceledAt).toLocaleString('es-AR')}
              </Text>
            </View>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>⚙️ Acciones</Text>

          {orden.paymentStatus === 'PAGADO' && orden.redeemStatus === 'PENDIENTE' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSuccess]}
              onPress={() => handleCambiarEstadoCanje('CANJEADO')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>✅ Marcar como CANJEADO</Text>
              )}
            </TouchableOpacity>
          )}

          {orden.redeemStatus === 'CANJEADO' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonWarning]}
              onPress={() => handleCambiarEstadoCanje('PENDIENTE')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>↩️ Regresar a PENDIENTE</Text>
              )}
            </TouchableOpacity>
          )}

          {orden.paymentStatus !== 'CANCELADO' && orden.redeemStatus !== 'CANJEADO' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={handleCancelarOrden}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>❌ Cancelar Pedido</Text>
              )}
            </TouchableOpacity>
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
    padding: moderateScale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  codeLabel: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    marginBottom: verticalScale(8),
  },
  code: {
    fontSize: moderateScale(32),
    fontWeight: 'bold',
    color: '#E50914',
    letterSpacing: 2,
  },
  orderId: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginTop: verticalScale(8),
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
  exportSmallButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
  exportSmallButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: 'bold',
  },
  statusContainer: {
    gap: verticalScale(8),
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: moderateScale(14),
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
  infoRow: {
    marginBottom: verticalScale(8),
  },
  infoLabel: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },
  infoValue: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    padding: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  itemCard: {
    backgroundColor: '#000000',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  itemName: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  itemTotal: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  itemDetails: {
    gap: verticalScale(4),
  },
  itemDetail: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  summaryLabel: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
  },
  summaryValue: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
  },
  summaryTotal: {
    marginTop: verticalScale(8),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  summaryLabelTotal: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryValueTotal: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#4CAF50',
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
  actionButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  actionButtonWarning: {
    backgroundColor: '#FF9800',
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