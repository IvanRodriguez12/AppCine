// app/(admin)/candyProducts/crear.tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
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
  Switch,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useAuth } from '@/context/authContext';
import AdminCandyProductsService, { 
  CandyCategoria, 
  CandyTipo,
  CrearProductoData 
} from '@/services/adminCandyProductsService';
import { Ionicons } from '@expo/vector-icons';

// Interfaz extendida para asegurar que stock sea number
interface FormProductoData extends CrearProductoData {
  stock: number;
}

export default function CrearProductoScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado del formulario con tipo extendido
  const [formData, setFormData] = useState<FormProductoData>({
    nombre: '',
    tipo: 'comida' as CandyTipo,
    categoria: 'comida' as CandyCategoria,
    precios: {
      chico: 0,
      mediano: 0,
      grande: 0,
    },
    stock: 0,
    activo: true,
    imageKey: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Opciones para los selects
  const tipos: { value: CandyTipo; label: string; icon: string }[] = [
    { value: 'promocion', label: 'Promoción', icon: '🎁' },
    { value: 'bebida', label: 'Bebida', icon: '🥤' },
    { value: 'comida', label: 'Comida', icon: '🍿' },
    { value: 'otros', label: 'Otros', icon: '📦' },
  ];

  const categorias: { value: CandyCategoria; label: string; icon: string }[] = [
    { value: 'bebida', label: 'Bebida', icon: '🥤' },
    { value: 'comida', label: 'Comida', icon: '🍿' },
    { value: 'otros', label: 'Otros', icon: '📦' },
  ];

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (formData.precios.chico <= 0) {
      newErrors.chico = 'El precio chico debe ser mayor a 0';
    }

    if (formData.precios.mediano <= 0) {
      newErrors.mediano = 'El precio mediano debe ser mayor a 0';
    }

    if (formData.precios.grande <= 0) {
      newErrors.grande = 'El precio grande debe ser mayor a 0';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handlePrecioChange = (tamanio: keyof typeof formData.precios, value: string) => {
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    
    setFormData(prev => ({
      ...prev,
      precios: {
        ...prev.precios,
        [tamanio]: numericValue,
      },
    }));

    // Limpiar error del precio
    if (errors[tamanio]) {
      setErrors(prev => ({
        ...prev,
        [tamanio]: '',
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🆕 Enviando datos del producto:', formData);
      
      const result = await AdminCandyProductsService.crearProducto(formData);
      
      if (result.success) {
        console.log('✅ Producto creado exitosamente:', result.data?.productId);
        
        Alert.alert(
          '¡Éxito!', 
          `Producto "${formData.nombre}" creado correctamente`,
          [
            {
              text: 'Ver Productos',
              onPress: () => router.replace('/(admin)/candyProducts'),
            },
            {
              text: 'Crear Otro',
              onPress: () => {
                // Resetear formulario
                setFormData({
                  nombre: '',
                  tipo: 'comida',
                  categoria: 'comida',
                  precios: {
                    chico: 0,
                    mediano: 0,
                    grande: 0,
                  },
                  stock: 0,
                  activo: true,
                  imageKey: '',
                });
                setErrors({});
              },
            },
          ]
        );
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('❌ Error creando producto:', error);
      Alert.alert(
        'Error', 
        error.message || 'No se pudo crear el producto. Intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (formData.nombre || formData.precios.chico > 0) {
      Alert.alert(
        '¿Salir sin guardar?',
        'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
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
              <Text style={styles.welcomeText}>Crear Producto</Text>
              <Text style={styles.roleText}>🍬 Nuevo producto</Text>
            </View>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>📝 Información Básica</Text>

          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              📛 Nombre del Producto {errors.nombre && <Text style={styles.errorText}> • {errors.nombre}</Text>}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                errors.nombre && styles.inputError
              ]}
              value={formData.nombre}
              onChangeText={(value) => handleInputChange('nombre', value)}
              placeholder="Ej: Popcorn Grande, Coca-Cola, Combo Especial..."
              placeholderTextColor="#8C8C8C"
              maxLength={50}
            />
            <Text style={styles.charCount}>
              {formData.nombre.length}/50 caracteres
            </Text>
          </View>

          {/* Tipo y Categoría */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: moderateScale(8) }]}>
              <Text style={styles.inputLabel}>🎯 Tipo</Text>
              <View style={styles.optionsGrid}>
                {tipos.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.value}
                    style={[
                      styles.optionButton,
                      formData.tipo === tipo.value && styles.optionButtonActive
                    ]}
                    onPress={() => handleInputChange('tipo', tipo.value)}
                  >
                    <Text style={styles.optionIcon}>{tipo.icon}</Text>
                    <Text style={[
                      styles.optionText,
                      formData.tipo === tipo.value && styles.optionTextActive
                    ]}>
                      {tipo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: moderateScale(8) }]}>
              <Text style={styles.inputLabel}>📂 Categoría</Text>
              <View style={styles.optionsGrid}>
                {categorias.map((categoria) => (
                  <TouchableOpacity
                    key={categoria.value}
                    style={[
                      styles.optionButton,
                      formData.categoria === categoria.value && styles.optionButtonActive
                    ]}
                    onPress={() => handleInputChange('categoria', categoria.value)}
                  >
                    <Text style={styles.optionIcon}>{categoria.icon}</Text>
                    <Text style={[
                      styles.optionText,
                      formData.categoria === categoria.value && styles.optionTextActive
                    ]}>
                      {categoria.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Precios */}
          <View style={styles.inputGroup}>
            <Text style={styles.sectionTitle}>💰 Precios</Text>
            <View style={styles.pricesContainer}>
              <View style={styles.priceInputGroup}>
                <Text style={styles.inputLabel}>
                  Chico {errors.chico && <Text style={styles.errorText}> • {errors.chico}</Text>}
                </Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={[
                      styles.priceInput,
                      errors.chico && styles.inputError
                    ]}
                    value={formData.precios.chico === 0 ? '' : formData.precios.chico.toString()}
                    onChangeText={(value) => handlePrecioChange('chico', value)}
                    placeholder="0"
                    placeholderTextColor="#8C8C8C"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.priceInputGroup}>
                <Text style={styles.inputLabel}>
                  Mediano {errors.mediano && <Text style={styles.errorText}> • {errors.mediano}</Text>}
                </Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={[
                      styles.priceInput,
                      errors.mediano && styles.inputError
                    ]}
                    value={formData.precios.mediano === 0 ? '' : formData.precios.mediano.toString()}
                    onChangeText={(value) => handlePrecioChange('mediano', value)}
                    placeholder="0"
                    placeholderTextColor="#8C8C8C"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.priceInputGroup}>
                <Text style={styles.inputLabel}>
                  Grande {errors.grande && <Text style={styles.errorText}> • {errors.grande}</Text>}
                </Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={[
                      styles.priceInput,
                      errors.grande && styles.inputError
                    ]}
                    value={formData.precios.grande === 0 ? '' : formData.precios.grande.toString()}
                    onChangeText={(value) => handlePrecioChange('grande', value)}
                    placeholder="0"
                    placeholderTextColor="#8C8C8C"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Stock y Estado */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: moderateScale(8) }]}>
              <Text style={styles.inputLabel}>
                📦 Stock Inicial {errors.stock && <Text style={styles.errorText}> • {errors.stock}</Text>}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.stock && styles.inputError
                ]}
                value={formData.stock === 0 ? '' : formData.stock.toString()}
                onChangeText={(value) => handleInputChange('stock', parseInt(value) || 0)}
                placeholder="0"
                placeholderTextColor="#8C8C8C"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: moderateScale(8) }]}>
              <Text style={styles.inputLabel}>⚡ Estado</Text>
              <View style={styles.switchContainer}>
                <Text style={[
                  styles.switchLabel,
                  { color: formData.activo ? '#10B981' : '#EF4444' }
                ]}>
                  {formData.activo ? 'Activo ✅' : 'Inactivo ❌'}
                </Text>
                <Switch
                  value={formData.activo}
                  onValueChange={(value) => handleInputChange('activo', value)}
                  trackColor={{ false: '#EF4444', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          {/* Imagen (placeholder para futura implementación) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🖼️ Imagen del Producto</Text>
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="#8C8C8C" />
              <Text style={styles.imagePlaceholderText}>
                Funcionalidad de imagen próximamente
              </Text>
              <Text style={styles.imagePlaceholderSubtext}>
                Por ahora el producto se creará sin imagen
              </Text>
            </View>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleGoBack}
            disabled={isLoading}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.submitButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Creando...' : 'Crear Producto'}
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
    alignItems: 'center',
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
  formSection: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(16),
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  inputLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: verticalScale(8),
  },
  errorText: {
    color: '#EF4444',
    fontSize: moderateScale(14),
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    color: '#FFFFFF',
    fontSize: moderateScale(16),
  },
  inputError: {
    borderColor: '#EF4444',
  },
  charCount: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    textAlign: 'right',
    marginTop: verticalScale(4),
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: moderateScale(-4),
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    alignItems: 'center',
    minWidth: moderateScale(80),
  },
  optionButtonActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  optionIcon: {
    fontSize: moderateScale(20),
    marginBottom: verticalScale(4),
  },
  optionText: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    fontWeight: '500',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pricesContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  priceInputGroup: {
    flex: 1,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(16),
  },
  currencySymbol: {
    color: '#8C8C8C',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginRight: moderateScale(4),
  },
  priceInput: {
    flex: 1,
    padding: moderateScale(16),
    color: '#FFFFFF',
    fontSize: moderateScale(16),
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
  },
  switchLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  imagePlaceholder: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#404040',
    borderStyle: 'dashed',
    borderRadius: moderateScale(12),
    padding: verticalScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#8C8C8C',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginTop: verticalScale(12),
    textAlign: 'center',
  },
  imagePlaceholderSubtext: {
    color: '#666666',
    fontSize: moderateScale(14),
    marginTop: verticalScale(4),
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
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: verticalScale(40),
  },
});