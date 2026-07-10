import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setQuizAnswer } from './_quiz-progress-store';
import type { QuizOption } from './_taste-profile-store';

const OPTIONS: { letter: QuizOption; text: string }[] = [
  { letter: 'A', text: "Good food. That's really all I'm asking." },
  { letter: 'B', text: "A new trail. Somewhere the city hasn't gotten to yet." },
  { letter: 'C', text: 'Hard to get into. Worth the wait outside.' },
  { letter: 'D', text: 'A coffee shop worth crossing town for.' },
  { letter: 'E', text: 'The kind of place a local would have to tell you about.' },
];

export default function Q4Screen() {
  const router = useRouter();

  function handleSelect(letter: QuizOption) {
    setQuizAnswer('q4', letter);
    router.push('/q5');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Text style={styles.question}>Someone says "found a spot." You're hoping it's...</Text>
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
