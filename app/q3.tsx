import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setQuizAnswer } from './_quiz-progress-store';
import type { QuizOption } from './_taste-profile-store';

const OPTIONS: { letter: QuizOption; text: string }[] = [
  { letter: 'A', text: "Bad food. There's no coming back from that." },
  { letter: 'B', text: 'Crowds. I can feel my patience leaving already.' },
  { letter: 'C', text: "A room that's full but somehow completely dead." },
  { letter: 'D', text: "A whole market and nothing worth carrying home." },
  { letter: 'E', text: "Realizing I could've stayed home and had the same night." },
];

export default function Q3Screen() {
  const router = useRouter();

  function handleSelect(letter: QuizOption) {
    setQuizAnswer('q3', letter);
    router.push('/q4');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Text style={styles.question}>Fastest way to kill the mood?</Text>
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
