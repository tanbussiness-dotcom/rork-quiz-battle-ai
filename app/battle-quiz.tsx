import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Settings } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToMatch,
  submitPlayerAnswer,
  setCurrentQuestionIndex,
  setMatchResult,
  type MatchNode,
} from "@/services/match.service";
import { getBattleRoom } from "@/services/battle.service";
import { getQuestion } from "@/services/question.service";
import type { BattleRoom, BattleAnswer, Question } from "@/models";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function TimerRing({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const animatedValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const progress = timeLeft / totalTime;
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, totalTime, animatedValue]);

  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerRing}>
        <Animated.View
          style={[
            styles.timerProgress,
            {
              borderColor: animatedValue.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: ["#ef4444", "#f59e0b", Colors.primary],
              }),
            },
          ]}
        />
        <View style={styles.timerTextContainer}>
          <Text style={styles.timerText}>{Math.max(0, timeLeft)}</Text>
        </View>
      </View>
    </View>
  );
}

function FloatingPoints({ points, visible }: { points: number; visible: boolean }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      opacity.setValue(1);
      scale.setValue(1);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible, translateY, opacity, scale]);

  if (!visible) return null;

  const color = points > 0 ? Colors.primary : "#ef4444";
  const sign = points > 0 ? "+" : "";

  return (
    <Animated.View
      style={[
        styles.floatingPoints,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.floatingPointsText, { color, textShadowColor: color }]}>
        {sign}
        {points}
      </Text>
    </Animated.View>
  );
}

function ConfettiParticle({ delay, left }: { delay: number; left: string }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 100,
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 720,
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [delay, translateY, rotate, opacity]);

  const colors = [Colors.primary, Colors.secondary, "#f59e0b", "#ec4899", "#a855f7"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          left,
          backgroundColor: randomColor,
          transform: [
            { translateY },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 720],
                outputRange: ["0deg", "720deg"],
              }),
            },
          ],
          opacity,
        },
      ]}
    />
  );
}

export default function BattleQuizScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [match, setMatch] = useState<MatchNode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFloatingPoints, setShowFloatingPoints] = useState(false);
  const [floatingPointsValue, setFloatingPointsValue] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);


  const opponentId = match?.participants.find((id) => id !== user?.uid);
  const currentPlayerScore = match?.scores[user?.uid ?? ""] ?? 0;
  const opponentScore = match?.scores[opponentId ?? ""] ?? 0;
  const currentQuestionIndex = match?.currentQuestionIndex ?? 0;

  useEffect(() => {
    if (!roomId) {
      router.back();
      return;
    }

    const unsubscribe = subscribeToMatch(roomId as string, (matchData) => {
      setMatch(matchData);

      if (matchData?.result) {
        setShowResultModal(true);
      }
    });

    return unsubscribe;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    getBattleRoom(roomId as string).then((roomData) => {
      setRoom(roomData);

      if (roomData?.questions) {
        Promise.all(roomData.questions.map((qId) => getQuestion(qId))).then((loadedQuestions) => {
          const validQuestions = loadedQuestions.filter((q): q is Question => q !== null);
          setQuestions(validQuestions);
        });
      }
    });
  }, [roomId]);

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      setCurrentQuestion(questions[currentQuestionIndex]);
      setHasAnswered(false);
      setSelectedAnswer(null);
    }
  }, [currentQuestionIndex, questions]);

  useEffect(() => {
    if (!match?.countdown.running) return;

    const endsAt = match.countdown.endsAt;
    const serverNow = match.countdown.serverNow ?? Date.now();
    const clientOffset = Date.now() - serverNow;

    const interval = setInterval(() => {
      const remaining = Math.ceil((endsAt - Date.now() + clientOffset) / 1000);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleTimeUp();
      }
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.countdown]);

  const handleTimeUp = async () => {
    if (hasAnswered || !currentQuestion || !roomId || !user) return;

    setHasAnswered(true);

    const answer: BattleAnswer = {
      questionId: currentQuestion.id,
      answer: "",
      isCorrect: false,
      timeTaken: 10000,
      answeredAt: Date.now(),
    };

    await submitPlayerAnswer(roomId as string, user.uid, answer);

    setFloatingPointsValue(-5);
    setShowFloatingPoints(true);
    setTimeout(() => setShowFloatingPoints(false), 1000);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const handleAnswerSelect = async (answerText: string) => {
    if (hasAnswered || !currentQuestion || !roomId || !user) return;

    setHasAnswered(true);
    setSelectedAnswer(answerText);

    const isCorrect = answerText === currentQuestion.correctAnswer;
    const timeTaken = (10 - timeLeft) * 1000;

    const answer: BattleAnswer = {
      questionId: currentQuestion.id,
      answer: answerText,
      isCorrect,
      timeTaken,
      answeredAt: Date.now(),
    };

    await submitPlayerAnswer(roomId as string, user.uid, answer);

    const points = isCorrect ? 10 : -5;
    setFloatingPointsValue(points);
    setShowFloatingPoints(true);
    setTimeout(() => setShowFloatingPoints(false), 1000);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const moveToNextQuestion = async () => {
    if (!roomId) return;

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      if (!match) return;

      const scores = match.scores;
      const playerIds = Object.keys(scores);
      const sortedPlayers = playerIds.sort((a, b) => scores[b] - scores[a]);
      const winnerId = scores[sortedPlayers[0]] === scores[sortedPlayers[1]] ? null : sortedPlayers[0];

      await setMatchResult(roomId as string, { winnerId, scores });
      setShowResultModal(true);
    } else {
      await setCurrentQuestionIndex(roomId as string, nextIndex);
    }
  };

  const getPlayerAvatar = (playerId: string | undefined) => {
    if (!playerId) return "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg";
    const player = room?.players.find((p) => p.uid === playerId);
    return player?.photoURL ?? `https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-${(parseInt(playerId.slice(-1), 16) % 6) + 1}.jpg`;
  };

  const getPlayerName = (playerId: string | undefined) => {
    if (!playerId) return "Player";
    const player = room?.players.find((p) => p.uid === playerId);
    return player?.displayName ?? "Player";
  };

  const winnerId = match?.result?.winnerId;
  const isWinner = winnerId === user?.uid;
  const isDraw = winnerId === null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ height: insets.top, backgroundColor: Colors.surface }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>BATTLE QUIZ</Text>
          <Text style={styles.headerSubtitle}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Settings size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.playersSection}>
        <View style={styles.playerContainer}>
          <View style={styles.playerAvatarWrapper}>
            <Image source={{ uri: getPlayerAvatar(user?.uid) }} style={styles.playerAvatar} />
            <View style={[styles.playerRank, { backgroundColor: Colors.primary }]}>
              <Text style={styles.playerRankText}>1</Text>
            </View>
          </View>
          <Text style={styles.playerName} numberOfLines={1}>
            {getPlayerName(user?.uid)}
          </Text>
          <Text style={styles.playerScore}>{currentPlayerScore}</Text>
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.vsLine} />
        </View>

        <View style={styles.playerContainer}>
          <View style={styles.playerAvatarWrapper}>
            <Image source={{ uri: getPlayerAvatar(opponentId) }} style={styles.playerAvatar} />
            <View style={[styles.playerRank, { backgroundColor: Colors.secondary }]}>
              <Text style={styles.playerRankText}>2</Text>
            </View>
          </View>
          <Text style={styles.playerName} numberOfLines={1}>
            {getPlayerName(opponentId)}
          </Text>
          <Text style={[styles.playerScore, { color: Colors.secondary }]}>{opponentScore}</Text>
        </View>
      </View>

      <TimerRing timeLeft={timeLeft} totalTime={10} />

      {currentQuestion && (
        <View style={styles.questionSection}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.content}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {(currentQuestion.options ?? []).map((option, index) => {
              const optionLetter = ["A", "B", "C", "D"][index];
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              const showCorrect = hasAnswered && isCorrect;
              const showWrong = hasAnswered && isSelected && !isCorrect;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    showCorrect && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                  disabled={hasAnswered}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.optionLetter,
                        showCorrect && styles.optionLetterCorrect,
                        showWrong && styles.optionLetterWrong,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionLetterText,
                          (showCorrect || showWrong) && styles.optionLetterTextHighlight,
                        ]}
                      >
                        {optionLetter}
                      </Text>
                    </View>
                    <Text style={styles.optionText}>{option}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <FloatingPoints points={floatingPointsValue} visible={showFloatingPoints} />

      <Modal visible={showResultModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.resultModal}>
            <View style={styles.resultPlayers}>
              <View style={[styles.resultPlayer, !isWinner && !isDraw && styles.resultPlayerDim]}>
                <Image source={{ uri: getPlayerAvatar(user?.uid) }} style={styles.resultAvatar} />
                <Text style={styles.resultPlayerName}>{getPlayerName(user?.uid)}</Text>
                <Text style={[styles.resultPlayerScore, { color: Colors.primary }]}>
                  {currentPlayerScore}
                </Text>
              </View>

              <Text style={styles.resultVsText}>VS</Text>

              <View style={[styles.resultPlayer, isWinner && !isDraw && styles.resultPlayerDim]}>
                <Image source={{ uri: getPlayerAvatar(opponentId) }} style={styles.resultAvatar} />
                <Text style={styles.resultPlayerName}>{getPlayerName(opponentId)}</Text>
                <Text style={[styles.resultPlayerScore, { color: Colors.secondary }]}>
                  {opponentScore}
                </Text>
              </View>
            </View>

            <View style={styles.resultTitle}>
              {isDraw ? (
                <>
                  <Text style={styles.resultTitleText}>DRAW!</Text>
                  <Text style={styles.resultSubtitle}>It&apos;s a tie!</Text>
                </>
              ) : (
                <>
                  <Text style={styles.resultTitleText}>{isWinner ? "VICTORY!" : "DEFEAT"}</Text>
                  <Text style={styles.resultSubtitle}>
                    {isWinner ? "You won the battle!" : `${getPlayerName(winnerId)} wins the battle`}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity 
                style={styles.resultButtonPrimary} 
                onPress={() => {
                  router.replace({
                    pathname: "/battle-results" as any,
                    params: { isWinner: isWinner ? "true" : "false", roomId: roomId as string }
                  });
                }}
              >
                <Text style={styles.resultButtonPrimaryText}>View Results</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resultButtonSecondary}
                onPress={() => router.replace("/(tabs)/battle")}
              >
                <Text style={styles.resultButtonSecondaryText}>Back to Lobby</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isWinner && !isDraw && (
            <View style={styles.confettiContainer} pointerEvents="none">
              {Array.from({ length: 20 }).map((_, i) => (
                <ConfettiParticle key={i} delay={i * 100} left={`${(i * 5) % 100}%`} />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  playersSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  playerContainer: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  playerAvatarWrapper: {
    position: "relative",
  },
  playerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  playerRank: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  playerRankText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#000",
  },
  playerName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  playerScore: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  vsContainer: {
    alignItems: "center",
    gap: 4,
    marginHorizontal: 16,
  },
  vsText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.secondary,
    textShadowColor: Colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  vsLine: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  timerContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  timerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  timerProgress: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
  },
  timerTextContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  questionSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.text,
    lineHeight: 28,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCorrect: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: Colors.primary,
  },
  optionWrong: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "#ef4444",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetterCorrect: {
    backgroundColor: Colors.primary,
  },
  optionLetterWrong: {
    backgroundColor: "#ef4444",
  },
  optionLetterText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  optionLetterTextHighlight: {
    color: "#fff",
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  floatingPoints: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -50,
    marginTop: -25,
    zIndex: 1000,
  },
  floatingPointsText: {
    fontSize: 48,
    fontWeight: "700" as const,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  resultModal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultPlayers: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 32,
  },
  resultPlayer: {
    alignItems: "center",
    gap: 8,
  },
  resultPlayerDim: {
    opacity: 0.3,
  },
  resultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  resultPlayerName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  resultPlayerScore: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  resultVsText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  resultTitle: {
    alignItems: "center",
    marginBottom: 32,
  },
  resultTitleText: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.primary,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  resultActions: {
    gap: 12,
  },
  resultButtonPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  resultButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  resultButtonSecondary: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiParticle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
