import Header from '@/components/Header';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  View,
  TextInput
} from 'react-native';
import { useAuth } from '@/context/authContext';
import apiClient from '@/api/client'; 

const ConfiguracionCuenta = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleEliminar = async () => {
    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado');
      return;
    }

    if (confirmText.toLowerCase() !== 'eliminar') {
      Alert.alert('Error', 'Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    try {
      setIsDeleting(true);

      // Llamar al endpoint de eliminar cuenta
      const response = await apiClient.delete(`/users/${user.uid}`);

      if (response.status === 200) {
        setShowConfirmModal(false);
        
        Alert.alert(
          'Cuenta eliminada',
          'Tu cuenta ha sido eliminada permanentemente',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                router.replace('/(auth)/inicio');
              }
            }
          ]
        );
      } else {
        throw new Error('Error al eliminar cuenta');
      }
    } catch (error: any) {
      console.error('Error eliminando cuenta:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'No se pudo eliminar la cuenta'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="CineApp" onBack={() => router.back()} />
      
      <View style={styles.container}>
        <Text style={styles.title}>Opciones de cuenta</Text>
        
        <View style={styles.warningContainer}>
          <Text style={styles.warningTitle}>⚠️ Zona peligrosa</Text>
          <Text style={styles.warningText}>
            Esta acción es irreversible. Se eliminarán todos tus datos permanentemente.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.btnEliminar} 
          onPress={() => setShowConfirmModal(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>Eliminar cuenta permanentemente</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de confirmación */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Estás completamente seguro?</Text>
            
            <Text style={styles.modalText}>
              Esta acción NO se puede deshacer. Se eliminarán:
            </Text>
            
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Todos tus datos personales</Text>
              <Text style={styles.listItem}>• Tus compras y cupones</Text>
              <Text style={styles.listItem}>• Tus favoritos y reviews</Text>
              <Text style={styles.listItem}>• Tu cuenta de usuario</Text>
            </View>

            <Text style={styles.confirmInstruction}>
              Escribe <Text style={styles.boldText}>ELIMINAR</Text> para confirmar:
            </Text>

            <TextInput
              style={styles.confirmInput}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Escribe ELIMINAR"
              placeholderTextColor="#666"
              autoCapitalize="characters"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowConfirmModal(false);
                  setConfirmText('');
                }}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.deleteButton,
                  (isDeleting || confirmText.toLowerCase() !== 'eliminar') && styles.disabledButton
                ]}
                onPress={handleEliminar}
                disabled={isDeleting || confirmText.toLowerCase() !== 'eliminar'}
              >
                {isDeleting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Eliminar definitivamente</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  container: {
    padding: 24,
  },
  title: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 24, 
    marginBottom: 24,
    textAlign: 'center'
  },
  warningContainer: {
    backgroundColor: '#2a1a1a',
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warningText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  btnEliminar: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 12,
    lineHeight: 22,
  },
  listContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  listItem: {
    color: '#ff8888',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  confirmInstruction: {
    fontSize: 16,
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#ff4444',
  },
  confirmInput: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default ConfiguracionCuenta;