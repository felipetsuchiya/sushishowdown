import { Stack } from 'expo-router';
import { useEffect } from 'react';
import mobileAds from 'react-native-google-mobile-ads';

export default function RootLayout() {

  useEffect(() => {
    // Inicializa o SDK de anúncios assim que o app carregar
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob Inicializado!', adapterStatuses);
      });
  }, []);

  
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}