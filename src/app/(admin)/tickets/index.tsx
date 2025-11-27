import adminTicketsService, {
    AdminTicket,
    TicketEstado,
    TicketFilters,
    TicketStats,
} from '@/services/adminTicketService';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const ESTADOS: ('TODOS' | TicketEstado)[] = ['TODOS', 'confirmado', 'pendiente', 'cancelado'];

const AdminTicketsScreen: React.FC = () => {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | TicketEstado>('TODOS');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const filtros: TicketFilters = {
        limit: 50,
      };

      if (filtroEstado !== 'TODOS') {
        filtros.estado = filtroEstado;
      }

      // 1) Tickets
      const resultTickets = await adminTicketsService.getTickets(filtros);
      if (resultTickets.success && resultTickets.data) {
        setTickets(resultTickets.data.tickets || []);
      } else {
        Alert.alert('Error', resultTickets.error || 'No se pudieron cargar los tickets');
      }

      // 2) Stats
      const resultStats = await adminTicketsService.getStats();
      if (resultStats.success && resultStats.data) {
        setStats(resultStats.data);
      }
    } catch (error) {
      console.error('Error cargando tickets admin:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar los tickets');
    } finally {
      setIsLoading(false);
    }
  }, [filtroEstado]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

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

  const renderTicketCard = (ticket: AdminTicket) => (
    <TouchableOpacity
      key={ticket.id}
      style={styles.ticketCard}
      onPress={() => router.push(`/(admin)/tickets/${ticket.id}`)}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketId}>#{ticket.id}</Text>
        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(ticket.estado) + '33', borderColor: getEstadoColor(ticket.estado) },
          ]}
        >
          <Text style={styles.estadoText}>{ticket.estado.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.ticketRow}>
        <Text style={styles.ticketLabel}>Usuario: </Text>
        <Text style={styles.ticketValue}>{ticket.userId}</Text>
      </Text>

      <Text style={styles.ticketRow}>
        <Text style={styles.ticketLabel}>Función: </Text>
        <Text style={styles.ticketValue}>{ticket.showtimeId}</Text>
      </Text>

      <Text style={styles.ticketRow}>
        <Text style={styles.ticketLabel}>Asientos: </Text>
        <Text style={styles.ticketValue}>{ticket.asientos.join(', ') || 'N/A'}</Text>
      </Text>

      <View style={styles.ticketFooter}>
        <Text style={styles.ticketTotal}>{formatCurrency(ticket.total)}</Text>
        <Text style={styles.ticketDate}>{formatDate(ticket.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Cargando tickets...</Text>
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
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#E50914" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎟️ Tickets</Text>
          <Text style={styles.subtitle}>Gestión de tickets de funciones</Text>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#1E1E1E' }]}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#1B5E20' }]}>
              <Text style={styles.statLabel}>Confirmados</Text>
              <Text style={styles.statValue}>{stats.confirmados}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F57F17' }]}>
              <Text style={styles.statLabel}>Pendientes</Text>
              <Text style={styles.statValue}>{stats.pendientes}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#B71C1C' }]}>
              <Text style={styles.statLabel}>Cancelados</Text>
              <Text style={styles.statValue}>{stats.cancelados}</Text>
            </View>
          </View>
        )}

        {/* Filtros por estado */}
        <View style={styles.filterContainer}>
          <Text style={styles.sectionTitle}>Filtrar por estado</Text>
          <View style={styles.filterRow}>
            {ESTADOS.map((estado) => (
              <TouchableOpacity
                key={estado}
                style={[
                  styles.filterChip,
                  filtroEstado === estado && styles.filterChipActive,
                ]}
                onPress={() => setFiltroEstado(estado)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filtroEstado === estado && styles.filterChipTextActive,
                  ]}
                >
                  {estado.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lista */}
        <View style={styles.listContainer}>
          {tickets.length === 0 ? (
            <Text style={styles.emptyText}>No se encontraron tickets con los filtros actuales.</Text>
          ) : (
            tickets.map(renderTicketCard)
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminTicketsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: moderateScale(16),
    paddingBottom: verticalScale(32),
  },
  header: {
    marginBottom: verticalScale(16),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: '#BBBBBB',
    marginTop: 4,
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
    fontSize: moderateScale(14),
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginBottom: verticalScale(16),
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: moderateScale(12),
  },
  statValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: moderateScale(18),
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: verticalScale(12),
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  filterChip: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#111',
  },
  filterChipActive: {
    borderColor: '#E50914',
    backgroundColor: '#E50914',
  },
  filterChipText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
  },
  filterChipTextActive: {
    fontWeight: 'bold',
  },
  listContainer: {
    marginTop: verticalScale(8),
  },
  ticketCard: {
    backgroundColor: '#111111',
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: '#222222',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  ticketId: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  estadoBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(20),
    borderWidth: 1,
  },
  estadoText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: 'bold',
  },
  ticketRow: {
    fontSize: moderateScale(12),
    color: '#CCCCCC',
    marginTop: 2,
  },
  ticketLabel: {
    fontWeight: 'bold',
  },
  ticketValue: {
    color: '#FFFFFF',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: verticalScale(8),
  },
  ticketTotal: {
    color: '#E50914',
    fontWeight: 'bold',
    fontSize: moderateScale(15),
  },
  ticketDate: {
    color: '#AAAAAA',
    fontSize: moderateScale(11),
  },
  emptyText: {
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: verticalScale(16),
  },
  bottomSpacer: {
    height: verticalScale(40),
  },
});