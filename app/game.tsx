import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../src/config/firebaseConfig";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

const STORAGE_KEY = "@sushi_session_state";
const { width, height } = Dimensions.get("window");

export default function GameScreen() {
  const { sessionId, userName } = useLocalSearchParams();
  const [myCount, setMyCount] = useState(0);
  const [players, setPlayers] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [gameOver, setGameOver] = useState(false); // Novo estado para saber se acabou

  const playersRef = useRef<any[]>([]);

  // 1. Carrega dados locais (Persistência)
  useEffect(() => {
    checkSessionAndLoad();
  }, []);

  const checkSessionAndLoad = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.sessionId === sessionId) {
          setMyCount(parsed.count);
          setIsFinished(parsed.isFinished || false);
        } else {
          resetLocalData();
        }
      } else {
        resetLocalData();
      }
    } catch (e) {
      console.log("Erro ao carregar storage", e);
    }
  };

  const resetLocalData = async () => {
    setMyCount(0);
    setIsFinished(false);
    await saveLocalState(0, false);
  };

  const saveLocalState = async (count: number, finished: boolean) => {
    const data = {
      sessionId: sessionId,
      count: count,
      isFinished: finished,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // 2. Escuta o Firebase (Onde a mágica do Fim de Jogo acontece)
  useEffect(() => {
    if (!sessionId) return;
    const sessionDocRef = doc(db, "sessions", sessionId as string);

    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const sortedPlayers = data.players.sort(
          (a: any, b: any) => b.score - a.score
        );

        setPlayers(sortedPlayers);
        playersRef.current = sortedPlayers;

        // VERIFICAÇÃO DE FIM DE JOGO
        // Se a lista não estiver vazia E todos estiverem finalizados
        const allFinished =
          sortedPlayers.length > 0 &&
          sortedPlayers.every((p: any) => p.isFinished);

        if (allFinished) {
          setGameOver(true);
        } else {
          setGameOver(false);
        }
      } else {
        Alert.alert("Fim da linha", "A sessão foi encerrada.");
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  const updateMyScoreInFirebase = async (
    newCount: number,
    finished: boolean
  ) => {
    if (!sessionId) return;

    const currentPlayers = [...playersRef.current];
    const myIndex = currentPlayers.findIndex((p: any) => p.name === userName);

    if (myIndex >= 0) {
      currentPlayers[myIndex] = {
        ...currentPlayers[myIndex],
        score: newCount,
        isFinished: finished,
      };

      try {
        await updateDoc(doc(db, "sessions", sessionId as string), {
          players: currentPlayers,
        });
      } catch (e) {
        console.log("Erro ao sincronizar", e);
      }
    }
  };

  const handleAdd = () => {
    if (isFinished) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    const newCount = myCount + 1;
    setMyCount(newCount);
    saveLocalState(newCount, false);
    updateMyScoreInFirebase(newCount, false);
  };

  const handleRemove = () => {
    if (isFinished || myCount === 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const newCount = myCount - 1;
    setMyCount(newCount);
    saveLocalState(newCount, false);
    updateMyScoreInFirebase(newCount, false);
  };

  const handleFinish = () => {
    Alert.alert(
      "Estou Satisfeito!",
      "Ao confirmar, você trava seu placar. O jogo só acaba quando todos estiverem satisfeitos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            setIsFinished(true);
            saveLocalState(myCount, true);
            updateMyScoreInFirebase(myCount, true);
            try {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            } catch (e) {}
          },
        },
      ]
    );
  };

  const handleExit = () => {
    router.replace("/");
  };

  // --- RENDERIZAÇÃO DA TELA DE FIM DE JOGO (GAME OVER) ---
  if (gameOver) {
    const winner = players[0];
    const isWinnerMe = winner.name === userName;

    return (
      <View style={styles.gameOverContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.gameOverHeader}>
          <Text style={styles.gameOverTitle}>RESULTADO FINAL</Text>
          <Text style={styles.gameOverSubtitle}>A batalha acabou! 🏁</Text>
        </View>

        <View style={styles.winnerCard}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.winnerLabel}>O Grande Campeão</Text>
          <Text style={styles.winnerName}>{winner.name}</Text>
          <Text style={styles.winnerScore}>{winner.score} Peças</Text>
          {isWinnerMe && (
            <Text style={styles.youWonTag}>PARABÉNS, É VOCÊ!</Text>
          )}
        </View>

        <Text style={styles.tableTitle}>Placar Geral</Text>
        <FlatList
          data={players}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.resultRow,
                item.name === userName && styles.resultRowMe,
              ]}
            >
              <Text style={styles.resultRank}>#{index + 1}</Text>
              <Text
                style={[
                  styles.resultName,
                  item.name === userName && styles.resultNameMe,
                ]}
              >
                {item.name}
              </Text>
              <Text style={styles.resultScore}>{item.score}</Text>
            </View>
          )}
        />

        <TouchableOpacity style={styles.homeButton} onPress={handleExit}>
          <Text style={styles.homeButtonText}>VOLTAR AO INÍCIO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- RENDERIZAÇÃO DO JOGO ATIVO ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.myArea}>
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>Sua Contagem</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Sair?", "Vai abandonar a partida?", [
                { text: "Não", style: "cancel" },
                { text: "Sair", style: "destructive", onPress: handleExit },
              ]);
            }}
            style={styles.exitButton}
          >
            <Text style={styles.exitButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.bigNumber, isFinished && styles.finishedNumber]}>
          {myCount}
        </Text>
        <Text style={styles.piecesLabel}>peças</Text>

        {!isFinished ? (
          <View style={styles.controls}>
            <TouchableOpacity style={styles.btnMinus} onPress={handleRemove}>
              <Text style={styles.btnTextBlack}>-1</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnPlus} onPress={handleAdd}>
              <Text style={styles.btnTextWhite}>+1 🍣</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.finishedBadge}>
            <Text style={styles.finishedText}>AGUARDANDO O FIM...</Text>
          </View>
        )}
      </View>

      <View style={styles.leaderboardArea}>
        <Text style={styles.leaderboardTitle}>🏆 Ranking em Tempo Real</Text>

        <FlatList
          data={players}
          keyExtractor={(item) => item.name}
          renderItem={({ item, index }) => {
            const isMe = item.name === userName;
            let rankColor = "#FFF";
            let icon = "👤";
            if (index === 0) {
              rankColor = "#FFFDF0";
              icon = "🥇";
            }
            if (index === 1) {
              rankColor = "#F8F8F8";
              icon = "🥈";
            }
            if (index === 2) {
              rankColor = "#F8F8F8";
              icon = "🥉";
            }

            return (
              <View
                style={[
                  styles.playerRow,
                  { backgroundColor: isMe ? "#FFE0B2" : rankColor },
                  item.isFinished && { opacity: 0.6 },
                ]}
              >
                <View style={styles.playerInfo}>
                  <Text style={styles.rankPosition}>{index + 1}º</Text>
                  <Text style={styles.rankIcon}>{icon}</Text>
                  <View>
                    <Text style={styles.rowName}>
                      {item.name} {isMe ? "(Você)" : ""}
                    </Text>
                    {item.isFinished && (
                      <Text style={styles.statusFinished}>Satisfeito</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.rowScore}>{item.score}</Text>
              </View>
            );
          }}
        />

        {!isFinished && (
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>Estou Satisfeito ✋</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333",
  },
  // --- ESTILOS DO GAME OVER ---
  gameOverContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a", // Fundo escuro dramático
    padding: 24,
    justifyContent: "center",
  },
  gameOverHeader: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FF4500",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  gameOverSubtitle: {
    color: "#CCC",
    fontSize: 16,
    marginTop: 5,
  },
  winnerCard: {
    backgroundColor: "#FFD700", // Dourado
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  trophy: { fontSize: 50, marginBottom: 10 },
  winnerLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#856404",
    textTransform: "uppercase",
  },
  winnerName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  winnerScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  youWonTag: {
    marginTop: 10,
    backgroundColor: "#333",
    color: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: "bold",
    fontSize: 12,
    overflow: "hidden",
  },
  tableTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultRowMe: {
    backgroundColor: "#444",
    borderWidth: 1,
    borderColor: "#FF4500",
  },
  resultRank: { color: "#888", fontWeight: "bold", fontSize: 16, width: 30 },
  resultName: { color: "#FFF", fontSize: 18, flex: 1 },
  resultNameMe: { color: "#FF4500", fontWeight: "bold" },
  resultScore: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  homeButton: {
    backgroundColor: "#FF4500",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  homeButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },

  // --- ESTILOS DO JOGO ATIVO (Mantidos iguais) ---
  myArea: {
    height: height * 0.48,
    backgroundColor: "#FAFAFA",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 10,
  },
  topHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  exitButton: {
    padding: 8,
    backgroundColor: "#EEE",
    borderRadius: 8,
  },
  exitButtonText: {
    color: "#FF4500",
    fontWeight: "bold",
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 16,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "bold",
  },
  bigNumber: {
    fontSize: 90,
    fontWeight: "bold",
    color: "#333",
    lineHeight: 100,
  },
  finishedNumber: {
    color: "#CCC",
  },
  piecesLabel: {
    fontSize: 20,
    color: "#666",
    marginBottom: 15,
  },
  controls: {
    flexDirection: "row",
    gap: 20,
    width: "100%",
  },
  btnMinus: {
    flex: 1,
    backgroundColor: "#E0E0E0",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  btnPlus: {
    flex: 2,
    backgroundColor: "#FF4500",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  btnTextBlack: { fontSize: 24, fontWeight: "bold", color: "#333" },
  btnTextWhite: { fontSize: 24, fontWeight: "bold", color: "#FFF" },

  finishedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  finishedText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  leaderboardArea: {
    flex: 1,
    padding: 20,
  },
  leaderboardTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankPosition: {
    fontSize: 18,
    fontWeight: "900",
    color: "#888",
    width: 30,
  },
  rankIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  rowName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  rowScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF4500",
  },
  statusFinished: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  finishButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  finishButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
