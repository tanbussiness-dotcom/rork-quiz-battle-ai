import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { X, Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";
import AIMentor from "@/components/AIMentor";
import GradientButton from "@/components/GradientButton";
import AIGeneratingLoader from "@/components/AIGeneratingLoader";
import type { QuizQuestion } from "@/lib/gemini";
import { saveMinimalQuestion, getOfflineQuestions, generateAndStoreQuestions } from "@/services/question.service";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { QUIZ_TOPICS } from "@/constants/topics";
import { useI18n } from "@/contexts/I18nContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import Svg, { Circle } from "react-native-svg";

const QUESTIONS_PER_QUIZ = 10;
const TIME_PER_QUESTION = 30;

export default function QuizPlayScreen() {
  const router = useRouter();
  const { topic, difficulty } = useLocalSearchParams<{ topic?: string; difficulty?: string }>();
  const { profile, updateProfile, incrementScore } = useUserProfile();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { language } = useI18n();
  const { width: windowWidth } = useWindowDimensions();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const online = useOnlineStatus();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(TIME_PER_QUESTION);
  const [answered, setAnswered] = useState<boolean>(false);
  const [mentorQuestionId, setMentorQuestionId] = useState<string | null>(null);
  const slideX = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState<string | null>(null);

  const topicData = QUIZ_TOPICS.find((t) => t.id === topic);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (loading || answered) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, loading, answered]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      console.log("🔍 [Quiz] Starting to load questions...");
      console.log("🔍 [Quiz] Topic:", topicData?.name, "Difficulty:", difficulty, "Language:", language);
      
      const languageName = language === "vi" ? "Vietnamese" : "English";
      if (!online) {
        console.log("🔍 [Quiz] Offline mode - loading cached questions");
        const offline = await getOfflineQuestions();
        if (offline.length === 0) {
          Alert.alert(
            "Offline",
            "No cached questions found. Connect to the internet to generate questions.",
            [{ text: "OK", onPress: () => router.back() }]
          );
          setQuestions([]);
          return;
        }
        const mapped: QuizQuestion[] = offline.slice(0, QUESTIONS_PER_QUIZ).map((q) => ({
          id: q.id,
          type: (q.type as QuizQuestion["type"]) || "multiple_choice",
          question: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty as QuizQuestion["difficulty"],
          topic: q.topic,
        }));
        setQuestions(mapped);
        setAnswers(new Array(mapped.length).fill(null));
        return;
      }
      
      let chosenDifficulty = (typeof difficulty === "string" && difficulty.length > 0)
        ? (difficulty[0].toUpperCase() + difficulty.slice(1).toLowerCase())
        : "Medium";

      try {
        const rateKey = `ai_success_rate_${topicData?.id ?? "general"}`;
        const raw = await import("@react-native-async-storage/async-storage");
        const stored = await raw.default.getItem(rateKey);
        const rate = stored ? parseFloat(stored) : NaN;
        if (!Number.isNaN(rate)) {
          if (rate >= 85) chosenDifficulty = chosenDifficulty === "Challenge" ? "Challenge" : "Hard";
          else if (rate >= 70) chosenDifficulty = chosenDifficulty === "Easy" ? "Medium" : chosenDifficulty;
          else if (rate < 50) chosenDifficulty = "Easy";
        }
      } catch (e) {
        console.log("Adaptive difficulty read failed", e);
      }

      console.log("🔍 [Quiz] Generating", QUESTIONS_PER_QUIZ, "questions online via backend...");

      let generated: any[];
      try {
        generated = await generateAndStoreQuestions({
          topic: topicData?.name || "General Knowledge",
          count: QUESTIONS_PER_QUIZ,
          difficulty: chosenDifficulty as "Easy" | "Medium" | "Hard" | "Challenge",
          language: language === "vi" ? "Vietnamese" : "English",
        });
      } catch (backendError: any) {
        console.error("❌ [Quiz] Backend generation completely failed, using mock questions", backendError);
        
        const { getMockQuestions } = await import("@/lib/gemini");
        const mockQuestions = getMockQuestions(topicData?.name || "General Knowledge", QUESTIONS_PER_QUIZ);
        
        const mappedMock: any[] = mockQuestions.map(q => ({
          id: q.id,
          type: q.type,
          content: q.question,
          options: q.options,
          correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic: q.topic,
          source: "mock",
          createdByAI: false,
          timeLimit: 30,
          createdAt: Date.now(),
          language: language === "vi" ? "Vietnamese" : "English",
        }));
        
        generated = mappedMock;
        
        Alert.alert(
          "Using Sample Questions",
          "Could not connect to AI service. Playing with sample questions instead.",
          [{ text: "OK" }]
        );
      }
      
      const generatedQuestions: QuizQuestion[] = generated.map(q => ({
        id: q.id,
        type: (q.type as QuizQuestion["type"]) || "multiple_choice",
        question: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty as QuizQuestion["difficulty"],
        topic: q.topic,
      }));

      console.log("✅ [Quiz] All questions generated successfully:", generatedQuestions.length);
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(null));
    } catch (error: any) {
      console.error("❌ [Quiz] Error loading questions:", error);
      console.error("❌ [Quiz] Error details:", error.message);
      console.error("❌ [Quiz] Error stack:", error.stack);
      
      let errorMessage = "Failed to load questions. ";
      
      if (error.message?.includes("Failed to fetch") || error.message?.includes("fetch")) {
        errorMessage += "Cannot connect to the server. Please check your internet connection and try again.";
      } else if (error.message?.includes("Gemini")) {
        errorMessage += "AI service is currently unavailable. Please try again later.";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      Alert.alert("Error", errorMessage, [
        { text: "OK", onPress: () => router.back() },
      ]);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setAnswered(true);
    setSelectedAnswer(null);
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQuestionIndex] = null;
      return next;
    });
  };

  const handleAnswer = (answer: string) => {
    if (answered) return;

    setSelectedAnswer(answer);
    setAnswered(true);

    setAnswers((prev) => {
      const next = [...prev];
      next[currentQuestionIndex] = answer;
      return next;
    });

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setScore((prev) => prev + 10);
      setFlashColor("rgba(0, 230, 168, 0.25)");
      setTimeout(() => setFlashColor(null), 300);
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      setFlashColor("rgba(255, 71, 87, 0.2)");
      setTimeout(() => setFlashColor(null), 300);
    }
  };

  const handleNext = () => {
    Animated.timing(slideX, {
      toValue: -windowWidth,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setAnswered(false);
        setTimeLeft(TIME_PER_QUESTION);
        slideX.setValue(windowWidth);
        Animated.timing(slideX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start();
      } else {
        finishQuiz();
      }
    });
  };

  const ensureMentorQuestionSaved = useCallback(async () => {
    try {
      const q = questions[currentQuestionIndex];
      if (!q) return;
      if (mentorQuestionId) return;
      const id = await saveMinimalQuestion({
        content: q.question,
        correctAnswer: Array.isArray(q.correctAnswer) ? String((q.correctAnswer as string[])[0]) : String(q.correctAnswer as string),
        language: language === "vi" ? "Vietnamese" : "English",
      });
      setMentorQuestionId(id);
    } catch (e) {
      console.log("ensureMentorQuestionSaved error", e);
    }
  }, [questions, currentQuestionIndex, mentorQuestionId]);

  useEffect(() => {
    if (answered && selectedAnswer && questions[currentQuestionIndex]) {
      const q = questions[currentQuestionIndex];
      const isCorrect = selectedAnswer === q.correctAnswer;
      if (!isCorrect) {
        void ensureMentorQuestionSaved();
      }
    }
  }, [answered, selectedAnswer, currentQuestionIndex, questions, ensureMentorQuestionSaved]);

  const finishQuiz = async () => {
    const correctCount = questions.reduce((acc, q, i) => acc + (answers[i] != null && answers[i] === q.correctAnswer ? 1 : 0), 0);

    try {
      if (user?.uid) {
        const { updatePlayerProgress } = await import("@/services/user.service");
        await updatePlayerProgress(
          user.uid,
          score,
          correctCount,
          questions.length,
          'solo',
          topicData?.id
        );
      }
    } catch (e) {
      console.log("Progress save fallback to profile context", e);
      await incrementScore(score);
      await updateProfile({
        totalQuestions: (profile?.totalQuestions || 0) + questions.length,
        correctAnswers: (profile?.correctAnswers || 0) + correctCount,
        soloGamesPlayed: (profile?.soloGamesPlayed || 0) + 1,
      });
    }

    try {
      const raw = await import("@react-native-async-storage/async-storage");
      const rateKey = `ai_success_rate_${topicData?.id ?? "general"}`;
      const rate = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
      await raw.default.setItem(rateKey, String(Math.round(rate)));
    } catch (e) {
      console.log("Adaptive difficulty write failed", e);
    }

    router.replace({
      pathname: "/results" as any,
      params: {
        score: String(score),
        total: String(questions.length),
        correct: String(correctCount),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <AIGeneratingLoader 
          message="Generating AI Questions..."
          subMessage={`Creating ${QUESTIONS_PER_QUIZ} personalized ${topicData?.name ?? "quiz"} questions`}
        />
      </View>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No questions available.</Text>
            <GradientButton title="Retry" onPress={loadQuestions} />
            <TouchableOpacity onPress={() => router.back()} testID="back-from-empty">
              <Text style={styles.loadingText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const ringRadius = 28;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - timeLeft / TIME_PER_QUESTION);
  const isSmallScreen = windowWidth < 375;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.gradient}
      >
        <View style={[styles.content, { paddingTop: insets.top + 20, paddingHorizontal: isSmallScreen ? 12 : 20 }]} testID="solo-quiz-screen">
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              testID="close-quiz"
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.timerRingWrap}>
              <View style={styles.timerSvgWrap}>
                <Svg width={72} height={72} viewBox="0 0 72 72">
                  <Circle cx={36} cy={36} r={ringRadius} stroke={"rgba(255,255,255,0.08)"} strokeWidth={4} fill="none" />
                  <Circle
                    cx={36}
                    cy={36}
                    r={ringRadius}
                    stroke={Colors.primary}
                    strokeWidth={4}
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    fill="none"
                  />
                </Svg>
                <View style={styles.timerCenter}>
                  <Text style={[styles.timerText, timeLeft <= 10 && styles.timerWarning]}>{timeLeft}</Text>
                </View>
              </View>
              <Text style={styles.timerLabel}>Time</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1} / {questions.length}
            </Text>
          </View>

          <Animated.View style={[styles.questionContainer, { transform: [{ translateX: Animated.add(slideX, shakeX) }] }]} testID="question-wrapper">
            <GlowingCard style={styles.questionCard}>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </GlowingCard>

            <View style={styles.optionsContainer}>
              {currentQuestion.options?.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const showCorrect = answered && isCorrect;
                const showWrong = answered && isSelected && !isCorrect;

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleAnswer(option)}
                    disabled={answered}
                    activeOpacity={0.9}
                    testID={`option-${index}`}
                  >
                    <View
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionSelected,
                        showCorrect && styles.optionCorrect,
                        showWrong && styles.optionWrong,
                        selectedAnswer && !isSelected ? styles.optionFaded : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          (showCorrect || showWrong) && styles.optionTextHighlight,
                        ]}
                      >
                        {option}
                      </Text>
                      {showCorrect && <Check size={20} color={Colors.success} />}
                      {showWrong && <X size={20} color={Colors.error} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {answered && (
            <View style={styles.footer}>
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <GlowingCard style={styles.feedbackCard}>
                  <Text style={styles.feedbackTitle}>Correct</Text>
                  <Text style={styles.feedbackText}>
                    {currentQuestion.explanation}
                  </Text>
                </GlowingCard>
              ) : (
                <GlowingCard style={[styles.feedbackCard, styles.feedbackError]} testID="feedback-incorrect">
                  <Text style={styles.feedbackTitle}>Incorrect</Text>
                  <Text style={styles.feedbackText}>
                    {currentQuestion.explanation}
                  </Text>
                  {mentorQuestionId && selectedAnswer && (
                    <View style={{ marginTop: 12 }}>
                      <AIMentor
                        questionId={mentorQuestionId}
                        playerAnswer={selectedAnswer}
                      />
                    </View>
                  )}
                </GlowingCard>
              )}

              <GradientButton
                title={
                  currentQuestionIndex < questions.length - 1
                    ? "Next Question"
                    : "Finish Quiz"
                }
                onPress={handleNext}
                style={styles.nextButton}
              />
            </View>
          )}

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
        </View>
        {flashColor && (
          <View pointerEvents="none" style={[styles.flashOverlay, { backgroundColor: flashColor }]} />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  timerRingWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerSvgWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  timerCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  timerLabel: {
    marginTop: 6,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  timerText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  timerWarning: {
    color: Colors.error,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  questionContainer: {
    flex: 1,
  },
  questionCard: {
    padding: 20,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  optionFaded: {
    opacity: 0.5,
  },
  optionCorrect: {
    borderColor: Colors.success,
    backgroundColor: "rgba(0, 230, 168, 0.1)",
  },
  optionWrong: {
    borderColor: Colors.error,
    backgroundColor: "rgba(255, 71, 87, 0.1)",
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  optionTextHighlight: {
    fontWeight: "700" as const,
  },
  footer: {
    gap: 16,
    marginTop: 16,
  },
  feedbackCard: {
    padding: 16,
  },
  feedbackError: {
    borderColor: Colors.error,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  nextButton: {
    marginTop: 8,
  },
  scoreContainer: {
    position: "absolute",
    top: 20,
    left: "50%",
    transform: [{ translateX: -50 }],
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  flashOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
