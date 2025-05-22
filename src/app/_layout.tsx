import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';

const RootNavigation = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    };
    prepare();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {isReady && (
        isLogin ? <Redirect href="/(main)" /> : <Redirect href="/(auth)" />
      )}
    </>
  );
};

export default RootNavigation;
