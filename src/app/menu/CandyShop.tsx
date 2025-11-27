import Header from '@/components/Header';
import { useCarrito } from '@/context/CarritoContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, verticalScale } from 'react-native-size-matters';

// 🆕 API
import apiClient, { handleApiResponse, handleApiError } from '@/api/client';
import { CANDY_ENDPOINTS } from '@/api/endpoints';

// 🔹 Tipo básico según tu modelo CandyProduct del backend
type CandyProductApi = {
  id: string;
  nombre: string;
  tipo: 'promocion' | 'bebida' | 'comida' | 'otros';
  categoria: 'bebida' | 'comida' | 'otros';
  precios: Record<string, number>;
  stock: number;
  activo: boolean;
};

const CATEGORIAS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Bebidas', value: 'bebida' },
  { label: 'Comida', value: 'comida' },
  { label: 'Promociones', value: 'promocion' },
  { label: 'Otros', value: 'otros' },
];

const TAMANIOS = ['pequeño', 'mediano', 'grande'];

/**
 * 🖼️ Imagen genérica por tipo/categoría:
 * - Comida  -> pochoclos
 * - Bebida  -> gaseosa
 * - Promoción (combos) -> combos (pochoclos + gaseosa)
 * - Otros   -> misma imagen que combos
 */
const getGenericImageForProduct = (p: CandyProductApi) => {
  // Combos / promos y "otros" usan la misma imagen
  if (p.tipo === 'promocion' || p.categoria === 'otros') {
    return require('../../assets/images/bombo.png');
  }

  if (p.categoria === 'comida') {
    return require('../../assets/images/Pororo.png');
  }

  if (p.categoria === 'bebida') {
    return require('../../assets/images/bebida.png');
  }

  // Fallback de seguridad: combos
  return require('../../assets/images/bombo.png');
};

const CandyShop = () => {
  const insets = useSafeAreaInsets();

  const [productos, setProductos] = useState<CandyProductApi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [categoria, setCategoria] = useState('todos');
  const [tamaniosSeleccionados, setTamaniosSeleccionados] = useState<{
    [key: string]: string;
  }>({});

  const {
    state: { items: carrito },
    agregarItem,
    incrementarCantidad,
    decrementarCantidad,
    getProductKey,
    getItemByKey,
    getTotalItems,
    getTotalPrecio,
  } = useCarrito();

  // 🆕 Cargar productos desde el backend al montar la pantalla
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(CANDY_ENDPOINTS.GET_PRODUCTS);
        const { success, data, error: apiErr } =
          handleApiResponse<CandyProductApi[]>(response);

        if (!success || !data) {
          throw new Error(apiErr || 'No se pudieron cargar los productos');
        }

        // No tocamos las imágenes acá, todo lo resuelve getGenericImageForProduct
        setProductos(data);
      } catch (err: any) {
        console.error('Error cargando productos Candy:', err);
        const apiError = handleApiError(err);
        setError(apiError.error || 'Error cargando productos');
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const filtrarProductos = () => {
    if (categoria === 'todos') return productos;
    if (categoria === 'promocion')
      return productos.filter((p) => p.tipo === 'promocion');
    return productos.filter((p) => p.categoria === categoria);
  };

  const handleSeleccionTamanio = (productoId: string, tamanio: string) => {
    setTamaniosSeleccionados((prev) => ({ ...prev, [productoId]: tamanio }));
  };

  const tieneTamanios = (producto: CandyProductApi) => {
    return Object.keys(producto.precios).length > 1;
  };

  const getProductoEnCarrito = (producto: CandyProductApi) => {
    const tamanio = tieneTamanios(producto)
      ? tamaniosSeleccionados[producto.id] || 'mediano'
      : 'único';

    const productKey = getProductKey(producto, tamanio);
    return getItemByKey(productKey);
  };

  const agregarAlCarrito = (producto: CandyProductApi) => {
    const tamanio = tieneTamanios(producto)
      ? tamaniosSeleccionados[producto.id] || 'mediano'
      : 'único';

    const precio = producto.precios[tamanio];

    if (typeof precio !== 'number') {
      Alert.alert(
        'Error',
        'No se encontró precio para el tamaño seleccionado.'
      );
      return;
    }

    agregarItem({
      ...producto,
      imagen: getGenericImageForProduct(producto),
      tamanio,
      precio,
      cantidad: 1,
    });
  };

  const handleIncrementarCantidad = (producto: CandyProductApi) => {
    const tamanio = tieneTamanios(producto)
      ? tamaniosSeleccionados[producto.id] || 'mediano'
      : 'único';

    const productKey = getProductKey(producto, tamanio);
    incrementarCantidad(productKey);
  };

  const handleDecrementarCantidad = (producto: CandyProductApi) => {
    const tamanio = tieneTamanios(producto)
      ? tamaniosSeleccionados[producto.id] || 'mediano'
      : 'único';

    const productKey = getProductKey(producto, tamanio);
    decrementarCantidad(productKey);
  };

  const handleIrAlCarrito = () => {
    if (carrito.length === 0) {
      Alert.alert(
        'Carrito vacío',
        'Selecciona al menos un producto para continuar'
      );
      return;
    }

    router.push({
      pathname: 'menu/carrito/CarritoCandy',
    });
  };

  const productosFiltrados = filtrarProductos();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="CineApp" onBack={() => router.back()} />

      {/* Filtros por categoría */}
      <View style={styles.filtrosRow}>
        {CATEGORIAS.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.filtroBtn,
              categoria === cat.value && styles.filtroBtnActivo,
            ]}
            onPress={() => setCategoria(cat.value)}
          >
            <Text
              style={[
                styles.filtroBtnText,
                categoria === cat.value && styles.filtroBtnTextActivo,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading / Error */}
      {loading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="red" />
          <Text style={{ color: 'white', marginTop: 10 }}>
            Cargando productos...
          </Text>
        </View>
      )}

      {error && !loading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setCategoria('todos');
            }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: 'red',
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.lista,
            { paddingBottom: 100 + insets.bottom },
          ]}
          renderItem={({ item }) => {
            const tieneVariosTamanios = Object.keys(item.precios).length > 1;
            const tamanioSeleccionado = tieneVariosTamanios
              ? tamaniosSeleccionados[item.id] || 'mediano'
              : 'único';

            const precio = item.precios[tamanioSeleccionado];
            const productoEnCarrito = getProductoEnCarrito(item);

            return (
              <View style={styles.card}>
                {/* 🖼️ Imagen genérica por tipo/categoría */}
                <Image
                  source={getGenericImageForProduct(item)}
                  style={styles.imagen}
                />
                <View style={styles.info}>
                  <Text style={styles.nombre}>{item.nombre}</Text>

                  {tieneVariosTamanios && (
                    <View style={styles.tamaniosRow}>
                      {TAMANIOS.map((tam) => (
                        <TouchableOpacity
                          key={tam}
                          style={[
                            styles.tamanioBtn,
                            (tamaniosSeleccionados[item.id] || 'mediano') ===
                              tam && styles.tamanioBtnActivo,
                          ]}
                          onPress={() =>
                            handleSeleccionTamanio(item.id, tam)
                          }
                        >
                          <Text
                            style={[
                              styles.tamanioBtnText,
                              (tamaniosSeleccionados[item.id] ||
                                'mediano') === tam &&
                                styles.tamanioBtnTextActivo,
                            ]}
                          >
                            {tam.charAt(0).toUpperCase() + tam.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text style={styles.precio}>${precio} USD</Text>

                  {!productoEnCarrito ? (
                    <TouchableOpacity
                      style={styles.agregarBtn}
                      onPress={() => agregarAlCarrito(item)}
                    >
                      <Ionicons name="cart" size={18} color="white" />
                      <Text style={styles.agregarBtnText}>Agregar</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.cantidadControles}>
                      <TouchableOpacity
                        style={styles.cantidadBtn}
                        onPress={() => handleDecrementarCantidad(item)}
                      >
                        <Ionicons name="remove" size={16} color="white" />
                      </TouchableOpacity>

                      <Text style={styles.cantidadText}>
                        {productoEnCarrito.cantidad}
                      </Text>

                      <TouchableOpacity
                        style={styles.cantidadBtn}
                        onPress={() => handleIncrementarCantidad(item)}
                      >
                        <Ionicons name="add" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={[styles.carritoBar, { paddingBottom: insets.bottom }]}>
        <FontAwesome5 name="shopping-cart" size={22} color="white" />
        <Text style={styles.carritoText}>
          {getTotalItems()} producto(s) - Total: ${getTotalPrecio().toFixed(2)}
        </Text>
        <TouchableOpacity style={styles.pagarBtn} onPress={handleIrAlCarrito}>
          <Text style={styles.pagarBtnText}>Ir al Carrito</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'black' },
  filtrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: verticalScale(10),
    backgroundColor: '#222',
    paddingVertical: verticalScale(8),
  },
  filtroBtn: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: 20,
    backgroundColor: '#444',
  },
  filtroBtnActivo: {
    backgroundColor: 'red',
  },
  filtroBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filtroBtnTextActivo: {
    color: 'white',
  },
  lista: {
    paddingHorizontal: moderateScale(10),
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    marginBottom: verticalScale(16),
    overflow: 'hidden',
    alignItems: 'center',
  },
  imagen: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    backgroundColor: '#444',
  },
  info: {
    flex: 1,
    padding: moderateScale(12),
  },
  nombre: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(16),
    marginBottom: 6,
  },
  tamaniosRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  tamanioBtn: {
    backgroundColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  tamanioBtnActivo: {
    backgroundColor: 'red',
  },
  tamanioBtnText: {
    color: 'white',
    fontSize: 13,
  },
  tamanioBtnTextActivo: {
    color: 'white',
    fontWeight: 'bold',
  },
  precio: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  agregarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'red',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  agregarBtnText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  cantidadControles: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#444',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cantidadBtn: {
    backgroundColor: 'red',
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantidadText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  carritoBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  carritoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pagarBtn: {
    backgroundColor: 'red',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  pagarBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CandyShop;