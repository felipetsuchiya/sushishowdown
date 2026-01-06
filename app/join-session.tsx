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
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";

export default function JoinSessionScreen() {
  const [name, setName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@player_name").then((savedName) => {
      if (savedName) setName(savedName);
    });
  }, []);

  async function handleJoinSession() {
    if (name.trim() === "") {
      Alert.alert("Ops!", "Digite seu nome.");
      return;
    }
    if (sessionCode.length !== 6) {
      Alert.alert("Senha Inválida", "A senha deve ter 6 números.");
      return;
    }

    setLoading(true);

    try {
      const sessionsRef = collection(db, "sessions");
      // Busca TODAS as salas com essa senha
      const q = query(sessionsRef, where("password", "==", sessionCode.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert(
          "Não encontrada",
          "Nenhuma sala com essa senha foi achada."
        );
        setLoading(false);
        return;
      }

      // FILTRO INTELIGENTE:
      // Procura dentro dos resultados uma sala que esteja 'waiting' ou 'playing'
      // Ignora as salas 'finished' (antigas)
      const activeSessionDoc = querySnapshot.docs.find((doc) => {
        const data = doc.data();
        return data.status === "waiting" || data.status === "playing";
      });

      if (!activeSessionDoc) {
        Alert.alert(
          "Encerrada",
          "Todas as salas com essa senha já foram finalizadas."
        );
        setLoading(false);
        return;
      }

      const sessionData = activeSessionDoc.data();
      const sessionId = activeSessionDoc.id;

      // Validação de nome único
      const playerExists = sessionData.players.some(
        (p: any) => p.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (playerExists) {
        Alert.alert(
          "Nome em uso",
          "Já tem alguém com esse nome na sala. Tente outro."
        );
        setLoading(false);
        return;
      }

      // Adiciona o jogador
      // Se o status for 'playing', entra como Ready=true para não travar o jogo
      const isAlreadyPlaying = sessionData.status === "playing";

      await updateDoc(doc(db, "sessions", sessionId), {
        players: arrayUnion({
          name: name.trim(),
          score: 0,
          isReady: isAlreadyPlaying ? true : false,
          isHost: false,
          joinedAt: new Date().toISOString(),
        }),
      });

      await AsyncStorage.setItem("@player_name", name);

      // Se o jogo já estiver rolando, vai direto pra arena
      if (isAlreadyPlaying) {
        router.replace({
          pathname: "/game",
          params: { sessionId, userName: name },
        });
      } else {
        router.replace({
          pathname: "/lobby",
          params: {
            sessionId: sessionId,
            userName: name,
            isHost: "false",
          },
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao entrar na sala.");
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Entrar na Arena 🥢</Text>
        <Text style={styles.subtitle}>
          Digite o código que o líder te passou.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Seu Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Samurai Faminto"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Senha da Sala</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="000000"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={6}
            value={sessionCode}
            onChangeText={setSessionCode}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleJoinSession}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>ENTRAR AGORA</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
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
    color: "#333",
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
    borderColor: "#333",
  },
  button: {
    backgroundColor: "#FF4500",
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
