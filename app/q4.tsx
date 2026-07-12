import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setQuizAnswer } from './_quiz-progress-store';
import type { QuizOption } from './_taste-profile-store';

const OPTIONS: { letter: QuizOption; text: string; color: string }[] = [
  { letter: 'A', text: "Good food. That's really all I'm asking.", color: '#B84E38' },
  { letter: 'B', text: "A new trail. Somewhere the city hasn't gotten to yet.", color: '#3A6445' },
  { letter: 'C', text: 'Hard to get into. Worth the wait outside.', color: '#2A1F4E' },
  { letter: 'D', text: 'A coffee shop worth crossing town for.', color: '#6B4530' },
  { letter: 'E', text: 'The kind of place a local would have to tell you about.', color: '#5C4080' },
];

export default function Q4Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
  });

  if (!fontsLoaded && !fontError) return null;

  function handleSelect(letter: QuizOption) {
    setQuizAnswer('q4', letter);
    router.push('/q5');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={[styles.progressLabelWrapper, { marginTop: insets.top + 20 }]}>
        <Text style={styles.progressLabel}>QUESTION 4 OF 5</Text>
      </View>
      <View style={styles.contentGroup}>
        <View style={styles.scoutPlaceholder} />
        <View style={styles.questionContainer}>
          <Text style={styles.question}>Someone says "found a spot." You're hoping it's...</Text>
        </View>
        <View style={styles.optionList}>
          {OPTIONS.map((option) => (
            <Pressable
              key={option.letter}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => handleSelect(option.letter)}
            >
              <View style={[styles.optionAccent, { backgroundColor: option.color }]} />
              <Text style={styles.optionText}>{option.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressLabelWrapper: {
    marginTop: 20,
  },
  progressLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: '#6B6460',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  contentGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  scoutPlaceholder: {
    width: 160,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F3EDE4',
    borderWidth: 1,
    borderColor: '#EDE8E2',
    alignSelf: 'center',
    marginTop: 52,
  },
  questionContainer: {
    marginTop: 44,
    marginBottom: 16,
  },
  question: {
    fontFamily: 'LibreBaskerville_700Bold',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'left',
  },
  optionList: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E2',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  optionPressed: {
    backgroundColor: '#FEF4E8',
  },
  optionAccent: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  optionText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
