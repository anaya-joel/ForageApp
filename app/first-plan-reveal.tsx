import { Redirect, Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getQuizAnswers } from './_quiz-progress-store';
import {
  scoreTasteProfile,
  setTasteProfile,
  setTasteProfileComplete,
  type QuizAnswers,
} from './_taste-profile-store';

function hasAllAnswers(answers: Partial<QuizAnswers>): answers is QuizAnswers {
  return (
    answers.q1 !== undefined &&
    answers.q2 !== undefined &&
    answers.q3 !== undefined &&
    answers.q4 !== undefined &&
    answers.q5 !== undefined
  );
}

export default function FirstPlanRevealScreen() {
  const router = useRouter();
  const answers = getQuizAnswers();

  if (!hasAllAnswers(answers)) {
    return <Redirect href="/welcome" />;
  }

  const result = scoreTasteProfile(answers);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Text style={styles.label}>First Plan Reveal</Text>
      {/* TEMP DEBUG — remove when building real reveal screen */}
      <Text style={styles.debug}>
        Categories: {result.categories.join(', ')}{'\n'}
        Vibes: {result.vibes.join(', ')}
      </Text>
      <Pressable
        style={styles.button}
        onPress={() => {
          setTasteProfile(result);
          setTasteProfileComplete(true);
          router.replace('/');
        }}
      >
        <Text style={styles.buttonText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 24,
    fontWeight: '600',
  },
  debug: {
    marginTop: 16,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
