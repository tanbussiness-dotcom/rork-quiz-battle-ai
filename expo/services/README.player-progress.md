# Player Progress Service

## Overview
The `updatePlayerProgress()` function is a comprehensive client-side service that handles player progression after completing a quiz or battle. This function runs on the client (not a Cloud Function) and performs the following operations:

1. **Updates XP, Level, and Points** based on correct answers
2. **Triggers Badge Unlocks** when achievement thresholds are reached
3. **Syncs Leaderboard Entries** automatically across all periods
4. **Tracks Statistics** for both solo and battle modes
5. **Maintains Topic-specific Progress**

## Usage

### Basic Example
```typescript
import { updatePlayerProgress } from '@/services/user.service';

// After a quiz is completed
await updatePlayerProgress(
  userId,           // User's Firebase UID
  100,              // Total score earned
  8,                // Number of correct answers
  10,               // Total questions
  'solo',           // Mode: 'solo' or 'battle'
  'mathematics'     // Optional: topic name
);
```

### Solo Mode Example
```typescript
// Called when user completes a solo quiz
const handleQuizComplete = async (results: QuizResults) => {
  try {
    await updatePlayerProgress(
      currentUser.uid,
      results.score,
      results.correctAnswers,
      results.totalQuestions,
      'solo',
      results.topic
    );
    
    console.log('Player progress updated successfully!');
    // Navigate to results screen
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
};
```

### Battle Mode Example
```typescript
// Called when a battle match completes
const handleBattleComplete = async (battleResult: BattleResult) => {
  try {
    const scoreChange = battleResult.won ? 100 : -50;
    
    await updatePlayerProgress(
      currentUser.uid,
      scoreChange,
      battleResult.correctAnswers,
      battleResult.totalQuestions,
      'battle',
      battleResult.topic
    );
    
    console.log('Battle stats updated!');
  } catch (error) {
    console.error('Failed to update battle progress:', error);
  }
};
```

## What Gets Updated

### User Profile
- **XP**: +10 XP per correct answer
- **Level**: Calculated as `floor(totalXP / 100) + 1`
- **Total Points**: Accumulated from all activities
- **Challenge Points**: Only for battle mode

### Statistics
- Total games played
- Total correct/wrong answers
- Win rate (battle mode only)
- Current streak (battle mode)
- Longest streak (battle mode)
- Battles won/lost counts

### Topic Progress
Per-topic tracking includes:
- Questions answered
- Correct answers
- Accuracy percentage

### Leaderboards
Automatically updated for all periods:
- Daily
- Weekly
- Monthly
- All-time

### Badge System

The following badges can be auto-unlocked:

| Badge ID | Condition |
|----------|-----------|
| `wise_scholar` | Reach 1,000 total points |
| `history_warrior` | Win 10 battles in history topic |
| `battle_god` | Reach Diamond rank |
| `hard_worker` | Maintain 7-day streak |
| `math_genius` | Answer 50 math questions correctly |
| `logic_master` | Complete 30 logic puzzles |

## Scoring Logic

### Solo Mode
```typescript
// XP Gain
const xpGain = correctAnswers * 10;

// Points (same as score)
const pointsGain = score;

// Level Up
const newLevel = Math.floor(totalXP / 100) + 1;
```

### Battle Mode
```typescript
// Win
+10 rank points
+1 current streak
Update longest streak if current > longest

// Lose
-5 rank points
Reset current streak to 0

// Win Rate
winRate = (totalWins / totalBattles) * 100;
```

## Example Integration in Quiz Screen

```typescript
import { useMutation } from '@tanstack/react-query';
import { updatePlayerProgress } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';

export default function QuizScreen() {
  const { user } = useAuth();
  
  const updateProgressMutation = useMutation({
    mutationFn: async (data: {
      score: number;
      correctAnswers: number;
      totalQuestions: number;
      mode: 'solo' | 'battle';
      topic?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      return updatePlayerProgress(
        user.uid,
        data.score,
        data.correctAnswers,
        data.totalQuestions,
        data.mode,
        data.topic
      );
    },
    onSuccess: () => {
      console.log('Progress updated!');
      // Refetch user profile, leaderboards, etc.
    },
    onError: (error) => {
      console.error('Failed to update progress:', error);
    }
  });

  const handleSubmitQuiz = () => {
    updateProgressMutation.mutate({
      score: calculateScore(),
      correctAnswers: countCorrect(),
      totalQuestions: questions.length,
      mode: 'solo',
      topic: currentTopic
    });
  };

  return (
    <View>
      {/* Quiz UI */}
      {updateProgressMutation.isPending && <Text>Saving progress...</Text>}
    </View>
  );
}
```

## Error Handling

The function includes comprehensive error handling:

```typescript
try {
  await updatePlayerProgress(...);
} catch (error) {
  if (error.message === 'User not found') {
    // Handle missing user
  } else {
    // Handle other errors
    console.error('Progress update failed:', error);
  }
}
```

## Performance Considerations

- Uses Firestore's `increment()` for atomic operations
- Batches multiple stat updates in single write
- Lazy-loads leaderboard service to reduce bundle size
- Only checks badges that haven't been unlocked yet

## Cloud Function Alternative

If you need backend infrastructure and want this as a Cloud Function instead, you would need to:

1. Enable backend for your project (click "Backend" in the header menu)
2. Migrate this logic to a Cloud Function
3. Add security rules and authentication checks
4. Call it via HTTPS callable function

However, the current client-side implementation works well for most use cases and provides real-time feedback.
