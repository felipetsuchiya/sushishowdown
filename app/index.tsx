import BannerComponent from '@/src/components/banner';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Image // <-- 1. Importamos o componente Image
  ,


































































  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['#FF4500', '#FF8C00']}
        style={styles.background}
      />

      <View style={styles.content}>

        {/* Logo Oficial */}
        <View style={styles.logoContainer}>
          <Image
            // 2. Coloque o caminho correto de onde o icon.jpg está salvo no seu projeto
            source={require('../assets/images/icon-homepage.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* Opcional: Mantive o título, mas se o ícone já disser tudo, você pode apagar esses Textos */}
          <Text style={styles.title}>SUSHI</Text>
          <Text style={styles.subtitle}>SHOWDOWN</Text>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.description}>
            Desafie seus amigos em tempo real. Quem come mais?
          </Text>

          {/* Botão Criar Sessão */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/create-session')}
          >
            <Text style={styles.createButtonText}>CRIAR SESSÃO</Text>
            <Text style={styles.buttonSubtextBlack}>Sou o Líder da Mesa</Text>
          </TouchableOpacity>

          {/* Botão Entrar na Sessão */}
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => router.push('/join-session')}
          >
            <Text style={styles.joinButtonText}>ENTRAR EM SESSÃO</Text>
            <Text style={styles.buttonSubtextWhite}>Tenho um código</Text>
          </TouchableOpacity>
        </View>
      </View>
      <BannerComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20, // Diminuí um pouco a margem para caber melhor a imagem
  },
  // 3. Adicionamos o estilo para a nova imagem
  logo: {
    width: 180,
    height: 180,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFE4B5',
    letterSpacing: 5,
  },
  menuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#FF4500',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF4500',
  },
  joinButtonText: {
    color: '#FF4500',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonSubtextBlack: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
    color: '#FFF'
  },
  buttonSubtextWhite: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
    color: '#FF4500'
  }
});