import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import React, { useState } from 'react';
import {
    Image,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const SobreNosotros: React.FC = () => {
    const router = useRouter();
    const [showTOS, setShowTOS] = useState(false);

    const handleBackPress = () => {
        router.back();
    };

    const openTOS = () => setShowTOS(true);

    const TOS = () => (
        <Modal
            visible={showTOS}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowTOS(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView showsVerticalScrollIndicator={true}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Términos y Condiciones</Text>
                            <Text style={styles.modalSubtitle}>
                                Términos y Condiciones de Uso – CineApp{"\n"}
                                Última actualización: 2025{"\n\n"}

                                Bienvenido/a a CineApp. Al utilizar nuestra aplicación, usted acepta los siguientes términos:

                                {"\n\n"}1. Descripción del servicio{"\n"}
                                CineApp permite consultar funciones, comprar entradas (si está disponible) y acceder a promociones. Algunas funciones pueden variar según región o cine asociado.

                                {"\n\n"}2. Registro y cuenta del usuario{"\n"}
                                Es posible que necesite crear una cuenta. Usted es responsable de la veracidad de los datos, la contraseña y reportar usos no autorizados.

                                {"\n\n"}3. Compras y pagos{"\n"}
                                Los precios dependen del cine. Los pagos se procesan con plataformas seguras externas. CineApp no almacena datos bancarios.

                                {"\n\n"}4. Uso permitido{"\n"}
                                Solo para uso personal. Prohibido hackeo, bots, manipulación o fraude.

                                {"\n\n"}5. Propiedad intelectual{"\n"}
                                Todo el contenido es propiedad de CineApp o titulares asociados. Se prohíbe la copia no autorizada.

                                {"\n\n"}6. Enlaces externos{"\n"}
                                CineApp puede mostrar enlaces externos. No somos responsables por su contenido o políticas.

                                {"\n\n"}7. Privacidad{"\n"}
                                Los datos se manejan según nuestra Política de Privacidad. Nunca vendemos información personal.

                                {"\n\n"}8. Limitación de responsabilidad{"\n"}
                                No garantizamos disponibilidad constante ni ausencia de errores.

                                {"\n\n"}9. Modificaciones{"\n"}
                                Podemos actualizar estos términos en cualquier momento.

                                {"\n\n"}10. Contacto{"\n"}
                                Email: soportetecnico@cineapp.com

                                {"\n\n"}11. Aceptación{"\n"}
                                Al usar CineApp, usted confirma haber leído y aceptado estos términos.
                            </Text>
                        </View>
                    </ScrollView>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setShowTOS(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <>
            <SafeAreaView style={styles.container}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                            <Ionicons name="arrow-back" size={28} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.title}>CineApp</Text>
                        <Image
                            source={require('../../assets/images/adaptive-icon.png')}
                            style={styles.logo}
                        />
                    </View>

                    <View style={styles.sectionTitleContainer}>
                        <Text style={styles.sectionTitle}>SOBRE NOSOTROS</Text>
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={[styles.infoText, { color: "#8C8C8C" }]}>
                            La aplicación definitiva para los amantes del cine. Encuentra los mejores estrenos,
                            compra entradas y disfruta de promociones exclusivas. © 2025 APPCINE.
                        </Text>
                        <Text style={[styles.infoText, { color: "#8C8C8C" }]}>
                            Versión 2.3.1
                        </Text>
                    </View>

                    {/* Terminos */}
                    <View style={styles.textoption}>
                        <Text style={styles.sectionTitle}>Términos y Condiciones</Text>
                        <TouchableOpacity onPress={openTOS}>
                            <Ionicons name="arrow-forward" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Redes */}
                    <View style={styles.infoContainer}>
                        <Text style={styles.sectionTitle}>Síguenos en redes sociales</Text>
                        <View style={styles.dropdownContent}>
                            <TouchableOpacity onPress={() => openBrowserAsync("https://instagram.com")}>
                                <Image style={styles.appicon} source={require('../../assets/images/instagram-logo.png')} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => openBrowserAsync("https://twitter.com")}>
                                <Image style={styles.appicon} source={require('../../assets/images/twitter-logo.png')} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => openBrowserAsync("https://facebook.com")}>
                                <Image style={styles.appicon} source={require('../../assets/images/facebook-logo.png')} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Soporte */}
                    <View style={styles.infoContainer}>
                        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Contactar a Soporte</Text>
                        <Text style={styles.infoText}>EMAIL: cineappmovil@gmail.com</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>

            <TOS />
        </>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(20),
  },
  backButton: {
    padding: moderateScale(4),
  },
  title: {
    fontSize: moderateScale(22),
    color: 'white',
    fontWeight: 'bold',
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
    resizeMode: 'contain',
    borderRadius: moderateScale(8),
  },
  textoption: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    marginBottom: verticalScale(16),
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(15),
    alignItems: 'center',
    margin: moderateScale(16),
    padding: moderateScale(16),
  },
  controlsContainer: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: verticalScale(20),
  },
  dropdownButton: {
    backgroundColor: '#ff0000',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    overflow: 'hidden',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(15),
    paddingHorizontal: moderateScale(16),
  },
  dropdownText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    flex: 1,
    marginLeft: moderateScale(12),
  },
  expandableContent: {
    backgroundColor: '#4a4a4a',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    overflow: 'hidden',
  },
  subButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(15),
    paddingHorizontal: moderateScale(16),
    backgroundColor: '#ff0000',
    marginBottom: verticalScale(4),
  },
  subButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(8),
  },
  cinemaOption: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  cinemaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cinemaAddress: {
    color: 'white',
    fontSize: moderateScale(14),
    marginLeft: moderateScale(8),
    flex: 1,
  },
  infoContainer: {
    backgroundColor: '#2a2a2a',
    margin: moderateScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  infoTitle: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  infoText: {
    color: '#ccc',
    fontSize: moderateScale(14),
    marginBottom: verticalScale(12),
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff0000',
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(6),
    alignSelf: 'flex-start',
  },
  directionsText: {
    color: 'white',
    fontSize: moderateScale(14),
    marginLeft: moderateScale(6),
    fontWeight: 'bold',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(40),
    paddingBottom: verticalScale(30),
  },
  navIcon: {
    padding: moderateScale(10),
  },
  appicon: {
    width: 64,
    height: 64,
    resizeMode: 'stretch',
  },
  recordButton: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: 'red',
  },
  sectionTitleContainer: {
    paddingHorizontal: moderateScale(16),
    marginBottom: verticalScale(15),
  },
  sectionTitle: {
    fontSize: moderateScale(22),
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.7)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: moderateScale(20)
  },

  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    width: '90%',
    maxHeight: '80%',       // << IMPORTANTE PARA PERMITIR SCROLL
  },

  modalHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(10)
  },

  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: verticalScale(10),
    textAlign: 'center'
  },

  modalSubtitle: {
    fontSize: moderateScale(14),
    color: '#ccc',
    marginBottom: verticalScale(10),
    textAlign: 'left',
    lineHeight: moderateScale(18)
  },

  modalButtons: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: verticalScale(15)
  },

  modalButton: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(10),
    width: '60%'
  },

  cancelButton: {       
    backgroundColor: '#444',
  },

  cancelButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    textAlign: 'center'
  },
});

export default SobreNosotros;