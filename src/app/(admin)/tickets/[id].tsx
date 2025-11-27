import adminTicketsService, {
    AdminTicket,
    TicketDetalleResponse,
    TicketEstado,
} from '@/services/adminTicketService';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const AdminTicketDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [ticket, setTicket] = useState<AdminTicket | null>(null);
  const [showtime, setShowtime] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadDetalle = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const result = await adminTicketsService.getDetalleTicket(String(id));

      if (result.success && result.data) {
        const data: TicketDetalleResponse = result.data;
        setTicket(data.ticket);
        setShowtime(data.showtime || null);
        setUser(data.user || null);
      } else {
        Alert.alert('Error', result.error || 'No se pudo cargar el ticket');
        router.back();
      }
    } catch (error) {
      console.error('Error cargando ticket admin:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar el ticket');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetalle();
  }, [id]);

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '$0';
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(value);
    } catch {
      return `$${value}`;
    }
  };

  const formatDate = (value: string | undefined | null): string => {
    if (!value) return 'N/A';
    try {
      const d = new Date(value);
      return d.toLocaleString('es-AR');
    } catch {
      return String(value);
    }
  };

  const getEstadoColor = (estado: TicketEstado): string => {
    switch (estado) {
      case 'confirmado':
        return '#4CAF50';
      case 'pendiente':
        return '#FFC107';
      case 'cancelado':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const handleCambiarEstado = (nuevoEstado: TicketEstado) => {
    if (!ticket || ticket.estado === nuevoEstado) return;

    const label =
      nuevoEstado === 'confirmado'
        ? '¿Marcar este ticket como CONFIRMADO?'
        : nuevoEstado === 'pendiente'
        ? '¿Marcar este ticket como PENDIENTE?'
        : '¿Marcar este ticket como CANCELADO?';

    Alert.alert('Confirmar cambio de estado', label, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            setIsProcessing(true);
            const result = await adminTicketsService.cambiarEstado(ticket.id!, nuevoEstado);
            if (result.success) {
              Alert.alert('Éxito', result.message || 'Estado actualizado');
              await loadDetalle();
            } else {
              Alert.alert('Error', result.error || 'No se pudo cambiar el estado');
            }
          } catch (error) {
            console.error('Error cambiando estado del ticket:', error);
            Alert.alert('Error', 'Ocurrió un error al cambiar el estado');
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const handleCancelarTicket = () => {
    if (!ticket) return;

    Alert.alert(
        'Cancelar Ticket',
        '¿Seguro que deseas cancelar este ticket? Esta acción liberará los asientos asociados.',
        [
        {
            text: 'No',
            style: 'cancel',
        },
        {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: async () => {
            try {
                setIsProcessing(true);
                console.log('[AdminTicket] Cancelando ticket', ticket.id);

                const result = await adminTicketsService.cancelarTicket(ticket.id!);

                console.log('[AdminTicket] Respuesta cancelarTicket:', result);

                if (result.success) {
                Alert.alert(
                    'Éxito',
                    result.message || 'Ticket cancelado exitosamente',
                    [
                    {
                        text: 'OK',
                        onPress: () => {
                        // Recargar datos del ticket para ver estado actualizado
                        loadDetalle();
                        },
                    },
                    ]
                );
                } else {
                Alert.alert(
                    'Error',
                    result.error || 'No se pudo cancelar el ticket. Intenta nuevamente.'
                );
                }
            } catch (error) {
                console.error('[AdminTicket] Error al cancelar ticket:', error);
                Alert.alert('Error', 'Ocurrió un error al cancelar el ticket.');
            } finally {
                setIsProcessing(false);
            }
            },
        },
        ],
        { cancelable: true }
    );
    };

  const handleReenviarQr = async () => {
    if (!ticket) return;

    try {
      setIsProcessing(true);
      const result = await adminTicketsService.reenviarQr(ticket.id!);
      if (result.success) {
        Alert.alert(
          'Solicitud registrada',
          result.message ||
            'Se registró el reenvío del QR. Recuerda que aún falta implementar el envío de emails.'
        );

        const qr = result.data?.qrCodeUrl || ticket.qrCodeUrl;
        if (qr) {
          Alert.alert('QR disponible', '¿Quieres abrir la URL del QR en el navegador?', [
            { text: 'No', style: 'cancel' },
            {
              text: 'Abrir',
              onPress: () => Linking.openURL(qr),
            },
          ]);
        }
      } else {
        Alert.alert('Error', result.error || 'No se pudo reenviar el QR');
      }
    } catch (error) {
      console.error('Error reenviando QR:', error);
      Alert.alert('Error', 'Ocurrió un error al reenviar el QR');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Cargando ticket...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>‹ Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ticket #{ticket.id}</Text>
          <View
            style={[
              styles.estadoBadge,
              {
                borderColor: getEstadoColor(ticket.estado),
                backgroundColor: getEstadoColor(ticket.estado) + '33',
              },
            ]}
          >
            <Text style={styles.estadoText}>{ticket.estado.toUpperCase()}</Text>
          </View>
        </View>

        {/* Info principal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Ticket</Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Total: </Text>
            <Text style={styles.value}>{formatCurrency(ticket.total)}</Text>
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Método de pago: </Text>
            <Text style={styles.value}>{ticket.metodoPago}</Text>
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Fecha de creación: </Text>
            <Text style={styles.value}>{formatDate(ticket.createdAt)}</Text>
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Asientos: </Text>
            <Text style={styles.value}>{ticket.asientos.join(', ') || 'N/A'}</Text>
          </Text>
        </View>

        {/* Showtime */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Función</Text>
          {showtime ? (
            <>
              <Text style={styles.row}>
                <Text style={styles.label}>ID función: </Text>
                <Text style={styles.value}>{showtime.id}</Text>
              </Text>
              {showtime.movieTitle && (
                <Text style={styles.row}>
                  <Text style={styles.label}>Película: </Text>
                  <Text style={styles.value}>{showtime.movieTitle}</Text>
                </Text>
              )}
              {showtime.room && (
                <Text style={styles.row}>
                  <Text style={styles.label}>Sala: </Text>
                  <Text style={styles.value}>{showtime.room}</Text>
                </Text>
              )}
              {showtime.startTime && (
                <Text style={styles.row}>
                  <Text style={styles.label}>Horario: </Text>
                  <Text style={styles.value}>{String(showtime.startTime)}</Text>
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.value}>No se encontró información de la función.</Text>
          )}
        </View>

        {/* Usuario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuario</Text>
          {user ? (
            <>
              <Text style={styles.row}>
                <Text style={styles.label}>UID: </Text>
                <Text style={styles.value}>{user.userId}</Text>
              </Text>
              {user.email && (
                <Text style={styles.row}>
                  <Text style={styles.label}>Email: </Text>
                  <Text style={styles.value}>{user.email}</Text>
                </Text>
              )}
              {user.displayName && (
                <Text style={styles.row}>
                  <Text style={styles.label}>Nombre: </Text>
                  <Text style={styles.value}>{user.displayName}</Text>
                </Text>
              )}
              {user.accountLevel && (
                <Text style={styles.row}>
                  <Text style={styles.label}>Nivel: </Text>
                  <Text style={styles.value}>{user.accountLevel}</Text>
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.value}>No se encontró información del usuario.</Text>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleCambiarEstado('confirmado')}
              disabled={isProcessing}
            >
              <Text style={styles.actionButtonText}>Marcar Confirmado</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FFC107' }]}
              onPress={() => handleCambiarEstado('pendiente')}
              disabled={isProcessing}
            >
              <Text style={styles.actionButtonText}>Marcar Pendiente</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F44336' }]}
              onPress={handleCancelarTicket}
              disabled={isProcessing}
            >
              <Text style={styles.actionButtonText}>Cancelar Ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
              onPress={handleReenviarQr}
              disabled={isProcessing}
            >
              <Text style={styles.actionButtonText}>Reenviar QR</Text>
            </TouchableOpacity>
          </View>

          {isProcessing && (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.processingText}>Procesando...</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminTicketDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: moderateScale(16),
    paddingBottom: verticalScale(32),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
  },
  header: {
    marginBottom: verticalScale(16),
  },
  backButton: {
    marginBottom: verticalScale(8),
  },
  backButtonText: {
    color: '#BBBBBB',
    fontSize: moderateScale(14),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(6),
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    marginTop: verticalScale(4),
  },
  estadoText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#111111',
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#222222',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  row: {
    marginTop: 2,
  },
  label: {
    color: '#BBBBBB',
    fontSize: moderateScale(13),
    fontWeight: 'bold',
  },
  value: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(10),
    marginTop: verticalScale(8),
  },
  actionButton: {
    flex: 1,
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: moderateScale(13),
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  processingText: {
    color: '#FFFFFF',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: verticalScale(40),
  },
});