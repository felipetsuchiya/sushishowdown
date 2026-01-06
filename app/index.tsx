import { router } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
// Vamos usar um gradiente laranja no fundo para ficar bonito?
// Se der erro, instale: npx expo install expo-linear-gradient
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF4500', '#FF8C00']} // Degradê Laranja
        style={styles.background}
      />
      
      <View style={styles.content}>
        {/* Logo / Splash Art improvisada com Emoji Gigante */}
        <View style={styles.logoContainer}>
          <Text style={styles.emoji}>🍣</Text>
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
            <Text style={styles.buttonSubtext}>Sou o Líder da Mesa</Text>
          </TouchableOpacity>

          {/* Botão Entrar na Sessão */}
          <TouchableOpacity 
            style={styles.joinButton} 
            onPress={() => router.push('/join-session')}
          >
            <Text style={styles.joinButtonText}>ENTRAR EM SESSÃO</Text>
            <Text style={styles.buttonSubtext}>Tenho um código</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 60,
  },
  emoji: {
    fontSize: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    fontStyle: 'italic', // Dá um ar de "Speed/Corrida"
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFE4B5', // Um bege claro
    letterSpacing: 5,
  },
  menuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Fundo branco meio transparente
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
    backgroundColor: '#333',
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
    backgroundColor: '#FFF',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  joinButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonSubtext: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
    // Cor condicional seria ideal, mas aqui vamos simplificar
  }
});