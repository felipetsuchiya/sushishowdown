import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../src/config/firebaseConfig";
// Adicionamos 'query', 'where', 'getDocs' para verificar duplicidade
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function CreateSessionScreen() {
  const [name, setName] = useState("");
  const [sessionPassword, setSessionPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@player_name").then((savedName) => {
      if (savedName) setName(savedName);
    });
  }, []);

  async function handleCreateSession() {
    if (name.trim() === "") {
      Alert.alert("Ops!", "Digite seu nome para continuar.");
      return;
    }
    if (sessionPassword.length !== 6) {
      Alert.alert(
        "Senha Inválida",
        "A senha precisa ter exatamente 6 números."
      );
      return;
    }

    setLoading(true);

    try {
      const passwordClean = sessionPassword.trim();
      const sessionsRef = collection(db, "sessions");

      // 1. VERIFICAÇÃO DE UNICIDADE
      // Busca todas as salas que têm essa senha
      const q = query(sessionsRef, where("password", "==", passwordClean));
      const querySnapshot = await getDocs(q);

      // Verifica se alguma delas ainda está ATIVA
      const activeSessionExists = querySnapshot.docs.some((doc) => {
        const data = doc.data();
        return data.status === "waiting" || data.status === "playing";
      });

      if (activeSessionExists) {
        Alert.alert(
          "Senha em uso",
          "Já existe uma mesa ativa com essa senha. Por favor, escolha outra combinação."
        );
        setLoading(false);
        return;
      }

      // 2. Se passou, cria a sala normalmente
      await AsyncStorage.setItem("@player_name", name);

      const sessionRef = await addDoc(collection(db, "sessions"), {
        createdAt: serverTimestamp(),
        hostName: name,
        password: passwordClean,
        status: "waiting",
        players: [
          {
            name: name,
            score: 0,
            isReady: true,
            isHost: true,
            joinedAt: new Date().toISOString(),
          },
        ],
      });

      router.replace({
        pathname: "/lobby",
        params: {
          sessionId: sessionRef.id,
          userName: name,
          isHost: "true",
        },
      });
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Erro",
        "Não foi possível verificar a disponibilidade da sala."
      );
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
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

          <Text style={styles.label}>Crie uma Senha (6 Números)</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="000000"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={6}
            value={sessionPassword}
            onChangeText={setSessionPassword}
          />
          <Text style={styles.helperText}>
            A senha deve ser única. Se já estiver em uso, avisaremos.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateSession}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>CRIAR SALA</Text>
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
    backgroundColor: "#FAFAFA",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF4500",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 20,
    color: "#333",
  },
  codeInput: {
    letterSpacing: 8,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 24,
  },
  helperText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: -10,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  backButtonText: {
    color: "#666",
    fontSize: 16,
  },
});
