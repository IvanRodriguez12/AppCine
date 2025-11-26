import apiClient from '@/api/client';
import { TMDB_API_KEY } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Pelicula = {
  poster_path: string;
  title: string;
};

type Showtime = {
  id: string;
  fecha: string; // 'YYYY-MM-DD'
  hora: string;  // 'HH:mm'
  precioBase?: number;
};

type HorarioUI = {
  label: string;     // lo que mostramos en el carrusel (ej: '18:30')
  showtimeId: string;
  fecha: string;     // fecha real 'YYYY-MM-DD'
  hora: string;      // hora real 'HH:mm'
};

const diasSemana = ['Dom.', 'Lun.', 'Mart.', 'Miérc.', 'Juev.', 'Vier.', 'Sáb.'];

const formatDiaLabel = (fechaStr: string): string => {
  const [year, month, day] = fechaStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const nombreDia = diasSemana[d.getDay()] ?? '';
  return `${nombreDia} ${day}`;
};

const CompraTicket = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cargando, setCargando] = useState(true);

  // Estado para showtimes
  const [dias, setDias] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<HorarioUI[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);
  const [horaSeleccionada, setHoraSeleccionada] = useState(0);
  const [scheduleByDay, setScheduleByDay] = useState<
    Record<string, HorarioUI[]>
  >({});
  const [showtimesError, setShowtimesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const movieId = Array.isArray(id) ? id[0] : id;
      if (!movieId) return;

      try {
        setCargando(true);
        setShowtimesError(null);

        // Pedimos en paralelo: TMDB + showtimes del backend
        const [movieRes, showtimesRes] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/movie/${movieId}?language=es-AR&api_key=${TMDB_API_KEY}`
          ),
          apiClient.get(`/showtimes/by-movie/${movieId}`),
        ]);

        // Datos de la película (TMDB)
        const movieData = await movieRes.json();
        setPelicula(movieData);

        // Datos de showtimes (backend)
        const backendData = showtimesRes.data as {
          movieId: number;
          fecha: string | null;
          count: number;
          showtimes: Showtime[];
        };

        const showtimes = backendData?.showtimes ?? [];

        if (!showtimes.length) {
          setDias([]);
          setHorarios([]);
          setScheduleByDay({});
          setShowtimesError('No hay funciones disponibles para esta película.');
        } else {
          // Agrupar showtimes por fecha
          const grouped: Record<string, Showtime[]> = {};
          showtimes.forEach((s) => {
            if (!grouped[s.fecha]) grouped[s.fecha] = [];
            grouped[s.fecha].push(s);
          });

          // Ordenar fechas
          const fechasOrdenadas = Object.keys(grouped).sort();

          const diasUI: string[] = [];
          const schedule: Record<string, HorarioUI[]> = {};

          fechasOrdenadas.forEach((fecha) => {
            const labelDia = formatDiaLabel(fecha);
            diasUI.push(labelDia);

            const horariosUI: HorarioUI[] = grouped[fecha]
              .sort((a, b) => a.hora.localeCompare(b.hora))
              .map((s) => ({
                label: s.hora,      // lo que se muestra en el carrusel
                showtimeId: s.id,
                fecha: s.fecha,
                hora: s.hora,
              }));

            schedule[labelDia] = horariosUI;
          });

          setDias(diasUI);
          setScheduleByDay(schedule);

          if (diasUI.length > 0) {
            const firstLabel = diasUI[0];
            const horariosIniciales = schedule[firstLabel] ?? [];
            setHorarios(horariosIniciales);
            setDiaSeleccionado(0);
            setHoraSeleccionada(0);
          }
        }
      } catch (e) {
        console.error('Error cargando datos de compra:', e);
        setShowtimesError('Ocurrió un error al cargar las funciones.');
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSelectDia = (index: number) => {
    setDiaSeleccionado(index);
    const diaLabel = dias[index];
    const horariosDia = scheduleByDay[diaLabel] ?? [];
    setHorarios(horariosDia);
    setHoraSeleccionada(0);
  };

  const handleSeleccionarAsientos = () => {
    const movieId = Array.isArray(id) ? id[0] : id;
    if (!movieId) return;

    const diaLabel = dias[diaSeleccionado];
    const horarioSeleccionado = horarios[horaSeleccionada];

    if (!diaLabel || !horarioSeleccionado) {
      // Si no hay funciones válidas, no navegamos
      return;
    }

    router.push({
      pathname: `/menu/asientos/${movieId}`,
      params: {
        // Para la UI actual, estos campos son suficientes
        fecha: horarioSeleccionado.fecha,   // fecha real 'YYYY-MM-DD'
        hora: horarioSeleccionado.hora,     // 'HH:mm'
        showtimeId: horarioSeleccionado.showtimeId, // lo usaremos en la pantalla de Asientos
      },
    });
  };

  if (cargando || !pelicula) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ff2b2b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w500${pelicula.poster_path}` }}
            style={styles.poster}
          />
          <Text style={styles.title}>{pelicula.title}</Text>
        </View>

        <View style={styles.selectionArea}>
          {/* Carrusel de días */}
          {dias.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.scroll}
            >
              {dias.map((dia, index) => (
                <TouchableOpacity
                  key={dia}
                  style={[
                    styles.option,
                    index === diaSeleccionado && styles.selected,
                  ]}
                  onPress={() => handleSelectDia(index)}
                >
                  <Text style={styles.optionText}>{dia}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Carrusel de horarios */}
          {horarios.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.scroll}
            >
              {horarios.map((horario, index) => (
                <TouchableOpacity
                  key={`${horario.showtimeId}-${index}`}
                  style={[
                    styles.option,
                    index === horaSeleccionada && styles.selected,
                  ]}
                  onPress={() => setHoraSeleccionada(index)}
                >
                  <Text style={styles.optionText}>{horario.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Mensaje cuando no hay funciones */}
          {showtimesError && (
            <Text style={{ color: 'white', marginTop: 12, textAlign: 'center' }}>
              {showtimesError}
            </Text>
          )}

          {/* Botón de seleccionar asientos (solo si hay showtimes) */}
          {horarios.length > 0 && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSeleccionarAsientos}
            >
              <Text style={styles.buttonText}>Seleccionar asientos</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    backgroundColor: '#2a2a2a',
    height: '52%',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  poster: {
    width: 280,
    height: 400,
    borderRadius: 12,
    backgroundColor: '#444',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 8,
  },
  selectionArea: {
    flex: 1,
    paddingTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    marginBottom: 0,
  },
  option: {
    backgroundColor: '#771111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'center',
    minWidth: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  selected: {
    backgroundColor: '#ff2b2b',
  },
  optionText: {
    color: 'white',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#ff2b2b',
    marginBottom: 100,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 0,
    alignSelf: 'stretch',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 8,
  },
});

export default CompraTicket;