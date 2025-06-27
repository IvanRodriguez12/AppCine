import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const [isLogin, setIsLogin] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      setIsReady(true);
    };
    prepare();
  }, []);

  if (!isReady) return null;

  return <Redirect href={isLogin ? '/(main)' : '/(auth)/inicio'} />;
}
