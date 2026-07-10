import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setQuizAnswer } from './_quiz-progress-store';
import type { QuizOption } from './_taste-profile-store';

const OPTIONS: { letter: QuizOption; text: string }[] = [
  { letter: 'A', text: 'Brunch that turns into the whole afternoon.' },
  { letter: 'B', text: 'Coffee shop, corner table, in no rush to be anywhere else.' },
  { letter: 'C', text: 'A morning hike before the city wakes up.' },
  { letter: 'D', text: 'Museum, before the crowds show up.' },
  { letter: 'E', text: 'Whatever just opened. I want to be first through the door.' },
];

export default function Q1Screen() {
  const router = useRouter();

  function handleSelect(letter: QuizOption) {
    setQuizAnswer('q1', letter);
    router.push('/q2');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Text style={styles.question}>Saturday morning, no plans yet. First move?</Text>
      <View style={styles.optionList}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.letter}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            onPress={() => handleSelect(option.letter)}
          >
            <Text style={styles.optionText}>{option.text}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  question: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 32,
  },
  optionList: {
    gap: 12,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 15,
  },
});
