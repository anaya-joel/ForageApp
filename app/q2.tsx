import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setQuizAnswer } from './_quiz-progress-store';
import type { QuizOption } from './_taste-profile-store';

const OPTIONS: { letter: QuizOption; text: string }[] = [
  { letter: 'A', text: "Just my appetite. I don't overpack for a meal." },
  { letter: 'B', text: 'A book, for whenever I find a good spot to sit.' },
  { letter: 'C', text: "The basics. I don't plan much past that." },
  { letter: 'D', text: 'Phone, ID, and enough cash for a cover charge.' },
  { letter: 'E', text: "A tote. I already know I'm not leaving empty-handed." },
];

export default function Q2Screen() {
  const router = useRouter();

  function handleSelect(letter: QuizOption) {
    setQuizAnswer('q2', letter);
    router.push('/q3');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Text style={styles.question}>What are you bringing?</Text>
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
