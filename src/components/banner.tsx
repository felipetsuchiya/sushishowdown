import React from 'react';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export default function BannerComponent() {
  // ATENÇÃO: Use o TestIds.BANNER enquanto estiver programando/testando.
  // Só troque para o ID real do seu bloco de anúncio quando for gerar a versão final (.aab/.apk)
  const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy';

  return (
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true, // Importante para regras de privacidade (LGPD/GDPR)
          }}
        />
  );
}