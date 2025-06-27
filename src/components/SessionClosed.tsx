import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const { width } = Dimensions.get('window');

interface SessionClosedProps {
  visible: boolean;
  onComplete: () => void;
}

const SessionClosed = ({ visible, onComplete }: SessionClosedProps) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Título */}
          <Text style={styles.title}>Sesión Cerrada</Text>
          
          {/* Ícono de check */}
          <View style={styles.checkContainer}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.8,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: moderateScale(32),
    fontWeight: 'bold',
    marginBottom: verticalScale(50),
    textAlign: 'center',
  },
  checkContainer: {
    alignItems: 'center',
  },
  checkCircle: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  checkMark: {
    fontSize: moderateScale(60),
    color: 'red',
    fontWeight: 'bold',
  },
});

export default SessionClosed;