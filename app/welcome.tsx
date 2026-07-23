import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Text style={styles.label}>Welcome</Text>
      <Pressable style={styles.button} onPress={() => router.push('/signup')}>
        <Text style={styles.buttonText}>Sign up</Text>
      </Pressable>
      <Pressable style={styles.buttonSecondary} onPress={() => router.push('/signin')}>
        <Text style={styles.buttonSecondaryText}>Sign in</Text>
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
  buttonSecondary: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  buttonSecondaryText: {
    color: '#222',
    fontSize: 16,
  },
});
