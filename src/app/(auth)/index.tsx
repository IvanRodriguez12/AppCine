import imagePath from "@/src/constants/imagePath";
import { router } from "expo-router";
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const Auth = () => {
    const [isLoading, setIsLoading] = useState(false);

    let navigateToInicio = () => {
        router.push("/(auth)/inicio");
    };

    let loadingTimeout = useCallback(() => {
        setIsLoading(true);
        setTimeout(navigateToInicio, 2000);
    }, []);

    useEffect(() => {
        setTimeout(loadingTimeout, 2000);
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
