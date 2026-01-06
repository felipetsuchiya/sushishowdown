import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../src/config/firebaseConfig";

export default function LobbyScreen() {
  const { sessionId, userName, isHost } = useLocalSearchParams();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Conexão em Tempo Real com a Sala
  useEffect(() => {
    if (!sessionId) return;

    const sessionRef = doc(db, "sessions", sessionId as string);

    // O onSnapshot roda toda vez que algo muda no banco de dados
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSessionData(data);
        setLoading(false);

        // Se o status mudou para 'playing', todos vão para o jogo!
        if (data.status === "playing") {
          router.replace({
            pathname: "/game",
            params: {
              sessionId: sessionId,
              userName: userName,
            },
          });
        }
      } else {
        Alert.alert("Erro", "Essa sessão foi encerrada.");
        router.back();
      }
    });

    // Limpa a conexão ao sair da tela
    return () => unsubscribe();
  }, [sessionId]);

  // Função para compartilhar a senha
  const shareCode = async () => {
    try {
      await Share.share({
        message: `Bora comer sushi! Entre na minha sala no Sushi Showdown. Senha: ${sessionData?.password}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Função: Jogador marca "Pronto"
  const toggleReady = async () => {
    if (!sessionData) return;

    // Encontra meu índice na lista de jogadores
    const updatedPlayers = sessionData.players.map((p: any) => {
      if (p.name === userName) {
        return { ...p, isReady: !p.isReady }; // Inverte o status
      }
      return p;
    });

    await updateDoc(doc(db, "sessions", sessionId as string), {
      players: updatedPlayers,
    });
  };

  // Função: Líder começa o jogo
  const startGame = async () => {
    // Verifica se todos estão prontos
    const allReady = sessionData.players.every((p: any) => p.isReady);

    if (!allReady) {
      Alert.alert("Calma!", "Todos os jogadores precisam estar PRONTOS.");
      return;
    }

    // Muda o status no banco -> O useEffect lá em cima vai perceber e navegar todo mundo
    await updateDoc(doc(db, "sessions", sessionId as string), {
      status: "playing",
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={{ marginTop: 20 }}>Entrando na sala...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roomTitle}>Mesa do {sessionData?.hostName}</Text>
        <TouchableOpacity style={styles.codeContainer} onPress={shareCode}>
          <Text style={styles.codeLabel}>SENHA DA SALA</Text>
          <Text style={styles.codeValue}>{sessionData?.password}</Text>
          <Text style={styles.codeHint}>(Toque para compartilhar)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        Quem vai comer? ({sessionData?.players?.length})
      </Text>

      <FlatList
        data={sessionData?.players}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View
            style={[
              styles.playerCard,
              item.isReady ? styles.playerReady : styles.playerNotReady,
            ]}
          >
            <View>
              <Text style={styles.playerName}>
                {item.name} {item.isHost ? "👑" : ""}{" "}
                {item.name === userName ? "(Você)" : ""}
              </Text>
              <Text style={styles.playerStatusText}>
                {item.isReady ? "PRONTO PARA COMER" : "ESPERANDO..."}
              </Text>
            </View>
            <Text style={styles.statusIcon}>{item.isReady ? "✅" : "⏳"}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        {/* Se eu sou o Líder (Host) */}
        {isHost === "true" ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              sessionData?.players.every((p: any) => p.isReady)
                ? styles.activeButton
                : styles.disabledButton,
            ]}
            onPress={startGame}
          >
            <Text style={styles.actionButtonText}>SERVIR A MESA (INICIAR)</Text>
          </TouchableOpacity>
        ) : (
          /* Se eu sou Jogador comum */
          <TouchableOpacity
            style={[styles.actionButton, styles.readyButton]}
            onPress={toggleReady}
          >
            <Text style={styles.actionButtonText}>
              {sessionData?.players.find((p: any) => p.name === userName)
                ?.isReady
                ? "NÃO ESTOU PRONTO"
                : "ESTOU PRONTO!"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  roomTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  codeContainer: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF4500",
    borderStyle: "dashed",
  },
  codeLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
    fontWeight: "bold",
  },
  codeValue: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FF4500",
    letterSpacing: 4,
  },
  codeHint: {
    fontSize: 12,
    color: "#FF4500",
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  playerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  playerReady: {
    backgroundColor: "#E8F5E9", // Verde claro
    borderColor: "#4CAF50",
  },
  playerNotReady: {
    backgroundColor: "#FFF",
    borderColor: "#DDD",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  playerStatusText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusIcon: {
    fontSize: 24,
  },
  footer: {
    marginTop: 20,
  },
  actionButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#FF4500",
  },
  disabledButton: {
    backgroundColor: "#CCC",
  },
  readyButton: {
    backgroundColor: "#333",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
