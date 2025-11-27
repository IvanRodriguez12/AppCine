// app/(admin)/cupones/crear.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  SafeAreaView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { adminCouponService } from '../../../services/adminCouponService';
import { CouponScope, CouponMode } from '../../../types/coupon';

type FormData = {
  code: string;
  scope: CouponScope;
  mode: CouponMode;
  value?: number;
  buyQuantity?: number;
  payQuantity?: number;
  premiumOnly: boolean;
  minAmount?: number;
  maxDiscount?: number;
  validFrom?: Date;
  validTo?: Date;
};

export default function CrearCuponScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    code: '',
    scope: 'both',
    mode: 'fixed',
    premiumOnly: false,
    value: undefined,
    buyQuantity: undefined,
    payQuantity: undefined,
    minAmount: undefined,
    maxDiscount: undefined,
    validFrom: undefined,
    validTo: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validaciones en tiempo real
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'code':
        if (!value || value.trim().length < 2) {
          return 'El código debe tener al menos 2 caracteres';
        }
        if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) {
          return 'Solo se permiten letras mayúsculas y números';
        }
        break;

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

    if (field === 'code') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else if (['value', 'buyQuantity', 'payQuantity', 'minAmount', 'maxDiscount'].includes(field)) {
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

    // Validación básica de código
    if (!formData.code || formData.code.trim().length < 2) {
      newErrors.code = 'El código es requerido (mínimo 2 caracteres)';
    }

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
    if (formData.validFrom && formData.validTo && formData.validFrom >= formData.validTo) {
      newErrors.validTo = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCoupon = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para el backend
      const couponData = {
        code: formData.code,
        scope: formData.scope,
        mode: formData.mode,
        value: formData.value,
        buyQuantity: formData.buyQuantity,
        payQuantity: formData.payQuantity,
        premiumOnly: formData.premiumOnly,
        minAmount: formData.minAmount,
        maxDiscount: formData.maxDiscount,
        validFrom: formData.validFrom?.toISOString(),
        validTo: formData.validTo?.toISOString(),
      };

      const result = await adminCouponService.crearCupon(couponData);
      
      Alert.alert(
        '✅ Cupón Creado',
        `Cupón ${result.code} creado exitosamente`,
        [
          {
            text: 'Ver Cupón',
            onPress: () => router.push(`/(admin)/cupones/${result.couponId}`)
          },
          {
            text: 'Crear Otro',
            onPress: () => {
              // Reset form
              setFormData({
                code: '',
                scope: 'both',
                mode: 'fixed',
                premiumOnly: false,
                value: undefined,
                buyQuantity: undefined,
                payQuantity: undefined,
                minAmount: undefined,
                maxDiscount: undefined,
                validFrom: undefined,
                validTo: undefined,
              });
              setErrors({});
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Error creando cupón:', error);
      Alert.alert('Error', error.message || 'No se pudo crear el cupón');
    } finally {
      setLoading(false);
    }
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

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Crear Cupón',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
        }} 
      />

      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Información Básica */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Información Básica</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Código del Cupón *</Text>
              <TextInput
                style={[styles.input, errors.code && styles.inputError]}
                placeholder="Ej: VERANO20"
                placeholderTextColor="#8C8C8C"
                value={formData.code}
                onChangeText={(value) => handleInputChange('code', value)}
                autoCapitalize="characters"
                maxLength={20}
              />
              {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
              <Text style={styles.helperText}>
                Solo letras mayúsculas y números. Mínimo 2 caracteres.
              </Text>
            </View>

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
            <Text style={styles.sectionTitle}>⚙️ Configuraciones</Text>
            
            <View style={styles.switchGroup}>
              <Text style={styles.label}>Solo para usuarios Premium</Text>
              <Switch
                value={formData.premiumOnly}
                onValueChange={(value) => handleInputChange('premiumOnly', value)}
                trackColor={{ false: '#333333', true: '#E50914' }}
                thumbColor={formData.premiumOnly ? '#FFFFFF' : '#F4F3F4'}
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
                    ? formData.validFrom.toLocaleDateString('es-ES') 
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
                    ? formData.validTo.toLocaleDateString('es-ES') 
                    : 'Seleccionar fecha'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#8C8C8C" />
              </TouchableOpacity>
              {errors.validTo && <Text style={styles.errorText}>{errors.validTo}</Text>}
            </View> {/* ← CORREGIDO: ahora es </View> */}
          </View>

          {/* Date Pickers */}
          {showDateFromPicker && (
            <DateTimePicker
              value={formData.validFrom || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDateFromPicker(false);
                if (date) handleInputChange('validFrom', date);
              }}
            />
          )}

          {showDateToPicker && (
            <DateTimePicker
              value={formData.validTo || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDateToPicker(false);
                if (date) handleInputChange('validTo', date);
              }}
            />
          )}

          {/* Botón de Crear */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateCoupon}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Crear Cupón</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
    padding: moderateScale(16),
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
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#E50914',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(16),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(20),
  },
  createButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(8),
  },
  bottomSpacer: {
    height: verticalScale(40),
  },
});