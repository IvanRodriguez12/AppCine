import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  SafeAreaView
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { adminCouponService, UpdateCouponData } from '../../../services/adminCouponService';
import { Coupon, CouponScope, CouponMode } from '../../../types/coupon';
import { enhanceCouponForFrontend, formatCouponValue, getCouponDescription } from '../../../utils/couponUtils';
import { CreateCouponData } from '../../../services/adminCouponService';
import { StyleSheet } from 'react-native';

type FormData = {
  scope: CouponScope;
  mode: CouponMode;
  value?: number;
  buyQuantity?: number;
  payQuantity?: number;
  premiumOnly: boolean;
  minAmount?: number;
  maxDiscount?: number;
  validFrom?: string;
  validTo?: string;
  active: boolean;
};

export default function EditarCuponScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const cuponId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cupon, setCupon] = useState<Coupon | null>(null);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    scope: 'both',
    mode: 'fixed',
    premiumOnly: false,
    active: true,
    value: undefined,
    buyQuantity: undefined,
    payQuantity: undefined,
    minAmount: undefined,
    maxDiscount: undefined,
    validFrom: undefined,
    validTo: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del cupón
  useEffect(() => {
    if (cuponId) {
      cargarCupon();
    }
  }, [cuponId]);

  const cargarCupon = async () => {
    try {
      setLoading(true);
      const cuponData = await adminCouponService.obtenerDetalleCupon(cuponId!);
      setCupon(cuponData);
      
      setFormData({
        scope: cuponData.scope,
        mode: cuponData.mode,
        value: cuponData.value,
        buyQuantity: cuponData.buyQuantity,
        payQuantity: cuponData.payQuantity,
        premiumOnly: cuponData.premiumOnly,
        minAmount: cuponData.minAmount,
        maxDiscount: cuponData.maxDiscount,
        validFrom: cuponData.validFrom,
        validTo: cuponData.validTo,
        active: cuponData.active,
      });
    } catch (error: any) {
      console.error('Error cargando cupón:', error);
      Alert.alert('Error', error.message || 'No se pudo cargar el cupón');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Validaciones en tiempo real
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'value':
        if (formData.mode === 'fixed' || formData.mode === 'percent') {
          if (!value && value !== 0) {
            return 'Este campo es requerido';
          }
          if (formData.mode === 'percent' && (value < 0 || value > 100)) {
            return 'El porcentaje debe estar entre 0 y 100';
          }
          if (value < 0) {
            return 'El valor no puede ser negativo';
          }
        }
        break;

      case 'buyQuantity':
      case 'payQuantity':
        if (formData.mode === '2x1' || formData.mode === '3x2') {
          if (!value && value !== 0) {
            return 'Este campo es requerido';
          }
          if (value < 1) {
            return 'Debe ser al menos 1';
          }
        }
        break;

      case 'minAmount':
      case 'maxDiscount':
        if (value && value < 0) {
          return 'No puede ser negativo';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    // Limpiar error del campo
    setErrors(prev => ({ ...prev, [field]: '' }));

    // Validar y formatear según el campo
    let processedValue = value;

    if (['value', 'buyQuantity', 'payQuantity', 'minAmount', 'maxDiscount'].includes(field)) {
      // Para campos numéricos, permitir solo números
      if (value === '') {
        processedValue = undefined;
      } else {
        const numValue = parseFloat(value);
        processedValue = isNaN(numValue) ? undefined : numValue;
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Validación en tiempo real
    const error = validateField(field, processedValue);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones según el modo
    if (formData.mode === 'fixed' || formData.mode === 'percent') {
      if (formData.value === undefined || formData.value === null) {
        newErrors.value = `El valor es requerido para modo ${formData.mode}`;
      } else if (formData.mode === 'percent' && (formData.value < 0 || formData.value > 100)) {
        newErrors.value = 'El porcentaje debe estar entre 0 y 100';
      }
    }

    if (formData.mode === '2x1' || formData.mode === '3x2') {
      if (!formData.buyQuantity) {
        newErrors.buyQuantity = 'Cantidad a comprar es requerida';
      }
      if (!formData.payQuantity) {
        newErrors.payQuantity = 'Cantidad a pagar es requerida';
      }
      if (formData.buyQuantity && formData.payQuantity && formData.buyQuantity <= formData.payQuantity) {
        newErrors.buyQuantity = 'La cantidad a comprar debe ser mayor que la cantidad a pagar';
      }
    }

    // Validación de fechas
    if (formData.validFrom && formData.validTo) {
      const fromDate = new Date(formData.validFrom);
      const toDate = new Date(formData.validTo);
      if (fromDate >= toDate) {
        newErrors.validTo = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
        Alert.alert('Error', 'Por favor corrige los errores en el formulario');
        return;
    }

    setSaving(true);
    try {
        // Preparar updates con el tipo correcto
        const updates: Partial<UpdateCouponData> = {
        scope: formData.scope,
        mode: formData.mode,
        value: formData.value,
        buyQuantity: formData.buyQuantity,
        payQuantity: formData.payQuantity,
        premiumOnly: formData.premiumOnly,
        minAmount: formData.minAmount,
        maxDiscount: formData.maxDiscount,
        active: formData.active, // ← Ahora sí está permitido
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        };
        
        await adminCouponService.actualizarCupon(cuponId!, updates);
        
        Alert.alert('✅ Cupón Actualizado', 'Los cambios se guardaron correctamente');
        
        // Recargar datos actualizados
        cargarCupon();
        
    } catch (error: any) {
        console.error('Error actualizando cupón:', error);
        Alert.alert('Error', error.message || 'No se pudo actualizar el cupón');
    } finally {
        setSaving(false);
    }
    };

  const handleToggleActive = async () => {
    try {
      const result = await adminCouponService.toggleActivarCupon(cuponId!);
      
      // Actualizar estado local
      setFormData(prev => ({ ...prev, active: result.active }));
      setCupon(prev => prev ? { ...prev, active: result.active } : null);
      
      Alert.alert(
        '✅ Estado Cambiado',
        `Cupón ${result.active ? 'activado' : 'desactivado'}`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cambiar el estado');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cupón',
      `¿Estás seguro de que quieres eliminar el cupón ${cupon?.code}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await adminCouponService.eliminarCupon(cuponId!);
              Alert.alert('✅ Cupón Eliminado', 'El cupón fue eliminado correctamente');
              router.push('/(admin)/cupones');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el cupón');
            }
          }
        }
      ]
    );
  };

  const renderModeSpecificFields = () => {
    switch (formData.mode) {
      case 'fixed':
      case 'percent':
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Valor {formData.mode === 'percent' ? '(0-100%)' : '(Monto fijo)'}
            </Text>
            <TextInput
              style={[styles.input, errors.value && styles.inputError]}
              placeholder={formData.mode === 'percent' ? 'Ej: 20' : 'Ej: 1500'}
              placeholderTextColor="#8C8C8C"
              value={formData.value?.toString() || ''}
              onChangeText={(value) => handleInputChange('value', value)}
              keyboardType="numeric"
            />
            {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
          </View>
        );

      case '2x1':
      case '3x2':
        return (
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Comprar (cantidad)</Text>
              <TextInput
                style={[styles.input, errors.buyQuantity && styles.inputError]}
                placeholder="Ej: 2"
                placeholderTextColor="#8C8C8C"
                value={formData.buyQuantity?.toString() || ''}
                onChangeText={(value) => handleInputChange('buyQuantity', value)}
                keyboardType="numeric"
              />
              {errors.buyQuantity && <Text style={styles.errorText}>{errors.buyQuantity}</Text>}
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Pagar (cantidad)</Text>
              <TextInput
                style={[styles.input, errors.payQuantity && styles.inputError]}
                placeholder="Ej: 1"
                placeholderTextColor="#8C8C8C"
                value={formData.payQuantity?.toString() || ''}
                onChangeText={(value) => handleInputChange('payQuantity', value)}
                keyboardType="numeric"
              />
              {errors.payQuantity && <Text style={styles.errorText}>{errors.payQuantity}</Text>}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando cupón...</Text>
      </View>
    );
  }

  if (!cupon) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Cupón no encontrado</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cuponMejorado = enhanceCouponForFrontend(cupon);

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Editar Cupón',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
        }} 
      />

      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Header Información */}
          <View style={styles.headerSection}>
            <View style={styles.codeHeader}>
              <Text style={styles.cuponCode}>{cupon.code}</Text>
              {cupon.premiumOnly && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>⭐ Premium</Text>
                </View>
              )}
            </View>
            <Text style={styles.cuponDescription}>
              {getCouponDescription(cupon)}
            </Text>
            
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                formData.active ? styles.statusActive : styles.statusInactive
              ]}>
                <Text style={styles.statusText}>
                  {formData.active ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
              
              {cuponMejorado._isExpired && (
                <View style={[styles.statusBadge, styles.statusExpired]}>
                  <Text style={styles.statusText}>Expirado</Text>
                </View>
              )}
              
              {cupon.createdAt && (
                <Text style={styles.createdDate}>
                  Creado: {new Date(cupon.createdAt).toLocaleDateString('es-ES')}
                </Text>
              )}
            </View>
          </View>

          {/* Información de Configuración */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Configuración</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alcance *</Text>
              <View style={styles.radioGroup}>
                {(['tickets', 'candyshop', 'both'] as CouponScope[]).map((scope) => (
                  <TouchableOpacity
                    key={scope}
                    style={[
                      styles.radioButton,
                      formData.scope === scope && styles.radioButtonSelected
                    ]}
                    onPress={() => handleInputChange('scope', scope)}
                  >
                    <Text style={[
                      styles.radioText,
                      formData.scope === scope && styles.radioTextSelected
                    ]}>
                      {scope === 'tickets' ? '🎫 Tickets' : 
                       scope === 'candyshop' ? '🍿 Golosinas' : '🎯 Ambos'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Descuento *</Text>
              <View style={styles.radioGroup}>
                {(['fixed', 'percent', '2x1', '3x2'] as CouponMode[]).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.radioButton,
                      formData.mode === mode && styles.radioButtonSelected
                    ]}
                    onPress={() => handleInputChange('mode', mode)}
                  >
                    <Text style={[
                      styles.radioText,
                      formData.mode === mode && styles.radioTextSelected
                    ]}>
                      {mode === 'fixed' ? '💰 Monto Fijo' : 
                       mode === 'percent' ? '📊 Porcentaje' : 
                       mode === '2x1' ? '🎯 2x1' : '🎯 3x2'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderModeSpecificFields()}
          </View>

          {/* Configuraciones Adicionales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Configuraciones Adicionales</Text>
            
            <View style={styles.switchGroup}>
              <Text style={styles.label}>Solo para usuarios Premium</Text>
              <Switch
                value={formData.premiumOnly}
                onValueChange={(value) => handleInputChange('premiumOnly', value)}
                trackColor={{ false: '#333333', true: '#E50914' }}
                thumbColor={formData.premiumOnly ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.label}>Cupón Activo</Text>
              <Switch
                value={formData.active}
                onValueChange={handleToggleActive}
                trackColor={{ false: '#333333', true: '#4CAF50' }}
                thumbColor={formData.active ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Monto Mínimo</Text>
                <TextInput
                  style={[styles.input, errors.minAmount && styles.inputError]}
                  placeholder="Ej: 5000"
                  placeholderTextColor="#8C8C8C"
                  value={formData.minAmount?.toString() || ''}
                  onChangeText={(value) => handleInputChange('minAmount', value)}
                  keyboardType="numeric"
                />
                {errors.minAmount && <Text style={styles.errorText}>{errors.minAmount}</Text>}
                <Text style={styles.helperText}>Compra mínima requerida</Text>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Tope Descuento</Text>
                <TextInput
                  style={[styles.input, errors.maxDiscount && styles.inputError]}
                  placeholder="Ej: 2000"
                  placeholderTextColor="#8C8C8C"
                  value={formData.maxDiscount?.toString() || ''}
                  onChangeText={(value) => handleInputChange('maxDiscount', value)}
                  keyboardType="numeric"
                />
                {errors.maxDiscount && <Text style={styles.errorText}>{errors.maxDiscount}</Text>}
                <Text style={styles.helperText}>Límite de descuento</Text>
              </View>
            </View>
          </View>

          {/* Fechas de Validez */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Validez</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de Inicio (Opcional)</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDateFromPicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.validFrom 
                    ? new Date(formData.validFrom).toLocaleDateString('es-ES') 
                    : 'Seleccionar fecha'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#8C8C8C" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de Fin (Opcional)</Text>
              <TouchableOpacity
                style={[styles.dateInput, errors.validTo && styles.inputError]}
                onPress={() => setShowDateToPicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.validTo 
                    ? new Date(formData.validTo).toLocaleDateString('es-ES') 
                    : 'Seleccionar fecha'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#8C8C8C" />
              </TouchableOpacity>
              {errors.validTo && <Text style={styles.errorText}>{errors.validTo}</Text>}
            </View>
          </View>

          {/* Date Pickers */}
          {showDateFromPicker && (
            <DateTimePicker
              value={formData.validFrom ? new Date(formData.validFrom) : new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDateFromPicker(false);
                if (date) handleInputChange('validFrom', date.toISOString());
              }}
            />
          )}

          {showDateToPicker && (
            <DateTimePicker
              value={formData.validTo ? new Date(formData.validTo) : new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDateToPicker(false);
                if (date) handleInputChange('validTo', date.toISOString());
              }}
            />
          )}

          {/* Botones de Acción */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Eliminar Cupón</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// Los estilos van aquí (los que ya teníamos)

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
    backgroundColor: '#000000',
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
  retryButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: moderateScale(16),
  },
  headerSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  cuponCode: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: moderateScale(8),
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(4),
  },
  premiumText: {
    fontSize: moderateScale(12),
    fontWeight: 'bold',
    color: '#000000',
  },
  cuponDescription: {
    fontSize: moderateScale(16),
    color: '#8C8C8C',
    marginBottom: verticalScale(12),
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(8),
    marginBottom: verticalScale(4),
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#F44336',
  },
  statusExpired: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createdDate: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },
  section: {
    backgroundColor: '#1A1A1A',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(16),
  },
  inputGroup: {
    marginBottom: verticalScale(16),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: verticalScale(8),
  },
  input: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(16),
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
  },
  helperText: {
    color: '#8C8C8C',
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: moderateScale(-4),
  },
  radioButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(8),
    margin: moderateScale(4),
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  radioText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#8C8C8C',
    textAlign: 'center',
  },
  radioTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: moderateScale(-4),
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
    paddingVertical: verticalScale(8),
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
  },
  dateText: {
    fontSize: moderateScale(16),
    color: '#FFFFFF',
  },
  actionsSection: {
    marginBottom: verticalScale(20),
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(16),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },
  saveButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(8),
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(16),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(8),
  },
  bottomSpacer: {
    height: verticalScale(40),
  },
});