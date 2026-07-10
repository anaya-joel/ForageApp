import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setQuizAnswer } from './_quiz-progress-store';
import type { QuizOption } from './_taste-profile-store';

const OPTIONS: { letter: QuizOption; text: string }[] = [
  { letter: 'A', text: 'The museum, for one more look at my favorite piece.' },
  { letter: 'B', text: 'Something I never got around to trying.' },
  { letter: 'C', text: "The market, finally buying the thing I've been eyeing." },
  { letter: 'D', text: 'My go-to café. My usual order, one more time.' },
  { letter: 'E', text: 'Out dancing until they kick us out.' },
];

export default function Q5Screen() {
  const router = useRouter();

  function handleSelect(letter: QuizOption) {
    setQuizAnswer('q5', letter);
    router.push('/first-plan-reveal');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Text style={styles.question}>It's your last night in the city for a while. Where do you go?</Text>
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
