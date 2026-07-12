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
  { letter: 'A', text: 'The museum, one more look at my favorite piece.', color: '#5C4080' },
  { letter: 'B', text: 'Something I never got around to trying.', color: '#2A7080' },
  { letter: 'C', text: "The market, finally buying the thing I've been eyeing.", color: '#A0622A' },
  { letter: 'D', text: 'My go-to café. My usual order, one more time.', color: '#6B4530' },
  { letter: 'E', text: 'Out dancing until they kick us out.', color: '#2A1F4E' },
];

export default function Q5Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
  });

  if (!fontsLoaded && !fontError) return null;

  function handleSelect(letter: QuizOption) {
    setQuizAnswer('q5', letter);
    router.push('/first-plan-reveal');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={[styles.progressLabelWrapper, { marginTop: insets.top + 20 }]}>
        <Text style={styles.progressLabel}>QUESTION 5 OF 5</Text>
      </View>
      <View style={styles.contentGroup}>
        <View style={styles.scoutPlaceholder} />
        <View style={styles.questionContainer}>
          <Text style={styles.question}>It's your last night in the city for a while. Where do you go?</Text>
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
