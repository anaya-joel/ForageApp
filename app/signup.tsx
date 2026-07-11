import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { setUserEmail, setUserName } from './_user-profile-store';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('you@example.com');
  const [nameError, setNameError] = useState(false);

  function handleNext() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setNameError(true);
      return;
    }

    setNameError(false);
    setUserName(trimmedName);
    setUserEmail(trimmedEmail);
    router.push('/q1');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Text style={styles.label}>Signup</Text>
      <View style={styles.field}>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError(false);
          }}
        />
        {nameError && <Text style={styles.errorText}>Enter your name to continue</Text>}
      </View>
      <View style={styles.field}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <Pressable style={styles.button} onPress={handleNext}>
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
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  field: {
    width: '100%',
    marginBottom: 12,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    fontSize: 15,
  },
  errorText: {
    marginTop: 6,
    color: '#c0392b',
    fontSize: 13,
  },
  button: {
    marginTop: 12,
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
