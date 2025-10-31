import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { X, Check, Clock } from "lucide-react-native";
import Colors from "@/constants/colors";
import GlowingCard from "@/components/GlowingCard";
import AIMentor from "@/components/AIMentor";
import GradientButton from "@/components/GradientButton";
import { generateQuestions, QuizQuestion } from "@/lib/gemini";
import { saveMinimalQuestion } from "@/services/question.service";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { QUIZ_TOPICS } from "@/constants/topics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const QUESTIONS_PER_QUIZ = 10;
const TIME_PER_QUESTION = 30;

export default function QuizPlayScreen() {
  const router = useRouter();
  const { topic } = useLocalSearchParams();
  const { profile, updateProfile, incrementScore } = useUserProfile();
  const insets = useSafeAreaInsets();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(TIME_PER_QUESTION);
  const [answered, setAnswered] = useState<boolean>(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [mentorQuestionId, setMentorQuestionId] = useState<string | null>(null);

  const topicData = QUIZ_TOPICS.find((t) => t.id === topic);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (!loading && !answered && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }

    if (timeLeft === 0 && !answered) {
      handleTimeout();
    }
  }, [timeLeft, loading, answered]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const generatedQuestions = await generateQuestions({
        topic: topicData?.name || "General Knowledge",
        difficulty: "Medium",
        count: QUESTIONS_PER_QUIZ,
        language: "English",
      });
      setQuestions(generatedQuestions);
    } catch (error: any) {
      console.error("Error loading questions:", error);
      Alert.alert("Error", "Failed to load questions. Please try again.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setAnswered(true);
  };

  const handleAnswer = (answer: string) => {
    if (answered) return;

    setSelectedAnswer(answer);
    setAnswered(true);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setScore((prev) => prev + 10);
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleNext = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setAnswered(false);
        setTimeLeft(TIME_PER_QUESTION);
        
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
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
        language: "English",
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
    const correctAnswers = questions.filter(
      (q, index) => selectedAnswer === q.correctAnswer
    ).length;

    await incrementScore(score);
    await updateProfile({
      totalQuestions: (profile?.totalQuestions || 0) + questions.length,
      correctAnswers: (profile?.correctAnswers || 0) + correctAnswers,
      soloGamesPlayed: (profile?.soloGamesPlayed || 0) + 1,
    });

    router.replace({
      pathname: "/results" as any,
      params: {
        score: score.toString(),
        total: QUESTIONS_PER_QUIZ.toString(),
        correct: correctAnswers.toString(),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[Colors.background, Colors.surface]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              Generating AI questions...
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.gradient}
      >
        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.timerContainer}>
              <Clock size={20} color={timeLeft <= 10 ? Colors.error : Colors.primary} />
              <Text style={[
                styles.timerText,
                timeLeft <= 10 && styles.timerWarning
              ]}>
                {timeLeft}s
              </Text>
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

          <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
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
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionSelected,
                        showCorrect && styles.optionCorrect,
                        showWrong && styles.optionWrong,
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
                  <Text style={styles.feedbackTitle}>🎉 Correct!</Text>
                  <Text style={styles.feedbackText}>
                    {currentQuestion.explanation}
                  </Text>
                </GlowingCard>
              ) : (
                <GlowingCard style={[styles.feedbackCard, styles.feedbackError]} testID="feedback-incorrect">
                  <Text style={styles.feedbackTitle}>❌ Incorrect</Text>
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
    padding: 20,
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
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    padding: 24,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    lineHeight: 28,
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
});
