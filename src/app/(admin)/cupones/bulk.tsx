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

type BulkFormData = {
  prefix: string;
  quantity: number;
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

export default function BulkCreateScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  const [formData, setFormData] = useState<BulkFormData>({
    prefix: '',
    quantity: 10,
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
      case 'prefix':
        if (!value || value.trim().length < 2) {
          return 'El prefijo debe tener al menos 2 caracteres';
        }
        if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) {
          return 'Solo se permiten letras mayúsculas y números';
        }
        break;

      case 'quantity':
        if (!value && value !== 0) {
          return 'La cantidad es requerida';
        }
        if (value < 1 || value > 1000) {
          return 'La cantidad debe estar entre 1 y 1000';
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

  const handleInputChange = (field: keyof BulkFormData, value: any) => {
    // Limpiar error del campo
    setErrors(prev => ({ ...prev, [field]: '' }));

    // Validar y formatear según el campo
    let processedValue = value;

    if (field === 'prefix') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else if (['quantity', 'value', 'buyQuantity', 'payQuantity', 'minAmount', 'maxDiscount'].includes(field)) {
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

    // Validación de prefijo
    if (!formData.prefix || formData.prefix.trim().length < 2) {
      newErrors.prefix = 'El prefijo es requerido (mínimo 2 caracteres)';
    }

    // Validación de cantidad
    if (!formData.quantity || formData.quantity < 1 || formData.quantity > 1000) {
      newErrors.quantity = 'La cantidad debe estar entre 1 y 1000';
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

  const handleBulkCreate = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para el backend
      const bulkData = {
        prefix: formData.prefix,
        quantity: formData.quantity,
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

      const result = await adminCouponService.crearCuponesBulk(bulkData);
      
      Alert.alert(
        '✅ Cupones Creados',
        `Se crearon ${result.quantity} cupones con prefijo ${result.prefix}`,
        [
          {
            text: 'Ver Cupones',
            onPress: () => router.push('/(admin)/cupones')
          },
          {
            text: 'Crear Más',
            onPress: () => {
              // Reset form manteniendo algunos valores
              setFormData(prev => ({
                ...prev,
                prefix: '',
                quantity: 10,
              }));
              setErrors({});
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Error creando cupones en bulk:', error);
      Alert.alert('Error', error.message || 'No se pudieron crear los cupones');
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

  const getPreviewCodes = () => {
    if (!formData.prefix || !formData.quantity) return [];
    
    const previewCount = Math.min(formData.quantity, 5);
    const codes = [];
    
    for (let i = 1; i <= previewCount; i++) {
      codes.push(`${formData.prefix}${String(i).padStart(4, '0')}`);
    }
    
    if (formData.quantity > 5) {
      codes.push(`... y ${formData.quantity - 5} más`);
    }
    
    return codes;
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Creación Masiva',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
        }} 
      />

      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Información de Generación Masiva */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Generación Masiva</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Prefijo *</Text>
                <TextInput
                  style={[styles.input, errors.prefix && styles.inputError]}
                  placeholder="Ej: VERANO"
                  placeholderTextColor="#8C8C8C"
                  value={formData.prefix}
                  onChangeText={(value) => handleInputChange('prefix', value)}
                  autoCapitalize="characters"
                  maxLength={10}
                />
                {errors.prefix && <Text style={styles.errorText}>{errors.prefix}</Text>}
                <Text style={styles.helperText}>
                  Base para los códigos
                </Text>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Cantidad *</Text>
                <TextInput
                  style={[styles.input, errors.quantity && styles.inputError]}
                  placeholder="Ej: 100"
                  placeholderTextColor="#8C8C8C"
                  value={formData.quantity?.toString() || ''}
                  onChangeText={(value) => handleInputChange('quantity', value)}
                  keyboardType="numeric"
                />
                {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
                <Text style={styles.helperText}>
                  Máx. 1000
                </Text>
              </View>
            </View>

            {/* Vista previa de códigos */}
            {formData.prefix && formData.quantity && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Vista Previa:</Text>
                {getPreviewCodes().map((code, index) => (
                  <Text key={index} style={styles.previewCode}>
                    {code}
                  </Text>
                ))}
                <Text style={styles.previewInfo}>
                  Los códigos se generarán como: {formData.prefix}0001, {formData.prefix}0002, etc.
                </Text>
              </View>
            )}
          </View>

          {/* Configuración del Cupón */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Configuración del Cupón</Text>
            
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
            </View>
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

          {/* Información de Lote */}
          <View style={[styles.section, styles.infoSection]}>
            <Text style={styles.infoTitle}>ℹ️ Información del Lote</Text>
            <Text style={styles.infoText}>
              • Se crearán {formData.quantity || 0} cupones activos{'\n'}
              • Prefijo: {formData.prefix || 'No definido'}{'\n'}
              • Formato: {formData.prefix}0001, {formData.prefix}0002, etc.{'\n'}
              • Todos los cupones tendrán la misma configuración
            </Text>
          </View>

          {/* Botón de Crear */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleBulkCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="duplicate-outline" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>
                  Crear {formData.quantity || 0} Cupones
                </Text>
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
  infoSection: {
    backgroundColor: '#2D2D2D',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(16),
  },
  infoTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: verticalScale(8),
  },
  infoText: {
    fontSize: moderateScale(14),
    color: '#8C8C8C',
    lineHeight: verticalScale(20),
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
  previewContainer: {
    backgroundColor: '#000000',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginTop: verticalScale(8),
  },
  previewTitle: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(8),
  },
  previewCode: {
    fontSize: moderateScale(12),
    color: '#4CAF50',
    fontFamily: 'monospace',
    marginBottom: verticalScale(2),
  },
  previewInfo: {
    fontSize: moderateScale(11),
    color: '#8C8C8C',
    marginTop: verticalScale(8),
    fontStyle: 'italic',
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