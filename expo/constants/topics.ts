export const QUIZ_TOPICS = [
  { id: "history", name: "World History", icon: "scroll-text", emoji: "🏛️" },
  { id: "science", name: "Science & Tech", icon: "flask-conical", emoji: "🔬" },
  { id: "math", name: "Mathematics", icon: "calculator", emoji: "🔢" },
  { id: "geography", name: "Geography", icon: "globe", emoji: "🌍" },
  { id: "literature", name: "Literature", icon: "book-open", emoji: "📚" },
  { id: "art", name: "Art & Culture", icon: "palette", emoji: "🎨" },
  { id: "sports", name: "Sports", icon: "trophy", emoji: "⚽" },
  { id: "music", name: "Music", icon: "music", emoji: "🎵" },
  { id: "movies", name: "Movies & TV", icon: "film", emoji: "🎬" },
  { id: "general", name: "General Knowledge", icon: "lightbulb", emoji: "💡" },
];

export type QuizTopic = typeof QUIZ_TOPICS[number];

export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard", "Challenge"] as const;
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

export const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "multiple_select",
  "fill_blank",
  "matching",
  "ordering",
] as const;
export type QuestionType = typeof QUESTION_TYPES[number];
