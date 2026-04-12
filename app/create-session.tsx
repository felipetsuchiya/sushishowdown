import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../src/config/firebaseConfig';

export default function CreateSessionScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@player_name').then(savedName => {
      if (savedName) setName(savedName);
    });
  }, []);

  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  async function handleCreateSession() {
    if (name.trim() === '') {
      Alert.alert('Ops!', 'Digite seu nome para continuar.');
      return;
    }

    setLoading(true);

    try {
      const sessionsRef = collection(db, 'sessions');
      let uniqueCode = '';
      let isUnique = false;

      while (!isUnique) {
        const potentialCode = generateRandomCode();
        const q = query(sessionsRef, where('password', '==', potentialCode));
        const querySnapshot = await getDocs(q);

        const activeSessionExists = querySnapshot.docs.some(doc => {
          const data = doc.data();
          return data.status === 'waiting' || data.status === 'playing';
        });

        if (!activeSessionExists) {
          uniqueCode = potentialCode;
          isUnique = true; 
        }
      }

      await AsyncStorage.setItem('@player_name', name);

      const sessionRef = await addDoc(collection(db, 'sessions'), {
        createdAt: serverTimestamp(),
        hostName: name,
        password: uniqueCode,
        status: 'waiting',
        players: { 
          [name]: { 
            name: name,
            score: 0,
            isReady: true,
            isHost: true,
            isFinished: false, 
            joinedAt: new Date().toISOString()
          }
        } 
      });

      router.replace({
        pathname: '/lobby',
        params: {
          sessionId: sessionRef.id,
          userName: name,
          isHost: 'true'
        }
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao criar a sala. Verifique sua conexão.');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* --- AQUI: Configuração do título da barra superior --- */}
      <Stack.Screen options={{ title: 'Criar Sessão' }} />
      {/* ---------------------------------------------------- */}

      <View style={styles.content}>
        <Text style={styles.title}>Criar Nova Mesa 🍣</Text>
        <Text style={styles.subtitle}>Você será o líder da sessão.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Seu Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Mestre do Sushi"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Código da Sala</Text>
            <Text style={styles.infoText}>
              Será gerado automaticamente um código de 6 dígitos para você compartilhar.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateSession}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>GERAR SALA E CÓDIGO</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#FFF3E0', 
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4,
  },
  infoText: {
    color: '#555',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#FF4500',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
});