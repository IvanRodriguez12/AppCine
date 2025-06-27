import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal
} from 'react-native';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');

interface ConfirmLogoutProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userName?: string;
  userEmail?: string;
}

const ConfirmLogout = ({ 
  visible, 
  onConfirm, 
  onCancel, 
  userName = "John Doe", 
  userEmail = "john.doe@email.com" 
}: ConfirmLogoutProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header con información del usuario */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
          </View>

          {/* Mensaje de confirmación */}
          <Text style={styles.confirmMessage}>
            ¿Estas seguro de que quieres cerrar sesión?
          </Text>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: 'black',
    borderRadius: moderateScale(15),
    padding: moderateScale(20),
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    alignSelf: 'flex-start',
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(15),
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(18),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#ccc',
    fontSize: moderateScale(14),
  },
  cuponesTitle: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: verticalScale(30),
    alignSelf: 'flex-start',
  },
  confirmMessage: {
    color: 'white',
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: verticalScale(30),
    lineHeight: moderateScale(24),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: moderateScale(15),
  },
  confirmButton: {
    flex: 1,
    backgroundColor: 'red',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'red',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
});

export default ConfirmLogout;