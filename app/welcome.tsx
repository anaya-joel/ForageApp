import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setTasteProfileComplete } from './_taste-profile-store';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      {/* DEV ONLY — remove before public release */}
      <Pressable
        style={[styles.skipButton, { top: insets.top + 10 }]}
        onPress={() => {
          setTasteProfileComplete(true);
          router.replace('/');
        }}
      >
        <Text style={styles.skipText}>Skip →</Text>
      </Pressable>

      <Text style={styles.label}>Welcome</Text>
      <Pressable style={styles.button} onPress={() => router.push('/signup')}>
        <Text style={styles.buttonText}>Next</Text>
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
  skipButton: {
    position: 'absolute',
    right: 20,
  },
  skipText: {
    color: '#999',
    fontSize: 13,
  },
});
