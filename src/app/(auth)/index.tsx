import imagePath from "@/constants/imagePath";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const Auth = () => {
    const [isLoading, setIsLoading] = useState(false);

    const loadingTimeout = useCallback(async () => {
        setIsLoading(true);

        const usuarioActual = await AsyncStorage.getItem('usuarioActual');

        setTimeout(() => {
            if (usuarioActual) {
                router.replace("/menu/menuPrincipal");
            } else {
                router.replace("/(auth)/inicio");
            }
        }, 1500);
    }, []);

    useEffect(() => {
        loadingTimeout();
    }, [loadingTimeout]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}></View>
            <View style={styles.body}>
                <Image source={imagePath.logo} style={styles.logoStyle} resizeMode='contain' />
                <Text style={styles.cineAppText}>CineApp</Text>
            </View>
            <View style={styles.footer}>
                {isLoading ? (
                    <>
                        <ActivityIndicator size={moderateScale(48)} color={"red"} />
                        <Text style={styles.tupText}>Loading...</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.fromText}>Todos los derechos reservados</Text>
                        <Text style={styles.tupText}>@CineApp 2025</Text>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        backgroundColor: "black",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: moderateScale(70),
    },
    header: {},
    body: {
        alignItems: "center",
        gap: verticalScale(7),
    },
    footer: {
        alignItems: "center",
        height: verticalScale(70),
        justifyContent: "flex-end",
    },
    logoStyle: {
        height: moderateScale(50),
        width: moderateScale(50),
    },
    cineAppText: {
        fontSize: moderateScale(30),
        fontWeight: "bold",
        color: "white",
    },
    fromText: {
        fontSize: moderateScale(12),
        color: "#867373",
    },
    tupText: {
        fontSize: moderateScale(15),
        color: "#867373",
    },
});

export default Auth;