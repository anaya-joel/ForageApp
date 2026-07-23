import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AUTH_ERROR_NO_ACCOUNT_FOUND, sendSignInOtp } from './_auth-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SigninScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [noAccount, setNoAccount] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleNext() {
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    const hasEmailError = !EMAIL_RE.test(trimmedEmail);

    setEmailError(hasEmailError);
    setNoAccount(false);
    setSubmitError(null);

    if (hasEmailError) return;

    setIsSubmitting(true);
    const { error } = await sendSignInOtp(trimmedEmail);
    setIsSubmitting(false);

    if (error === AUTH_ERROR_NO_ACCOUNT_FOUND) {
      setNoAccount(true);
      return;
    }
    if (error) {
      setSubmitError(error);
      return;
    }

    router.push({
      pathname: '/otp-verify',
      params: { email: trimmedEmail, mode: 'signin' },
    });
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Text style={styles.label}>Sign in</Text>
      <View style={styles.field}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError(false);
            if (noAccount) setNoAccount(false);
          }}
        />
        {emailError && <Text style={styles.errorText}>Enter a valid email address</Text>}
      </View>

      {noAccount && (
        <View style={styles.noAccountBox}>
          <Text style={styles.errorText}>We don't have an account for that email.</Text>
          <Pressable onPress={() => router.push('/signup')}>
            <Text style={styles.linkText}>Sign up instead</Text>
          </Pressable>
        </View>
      )}

      {submitError && <Text style={styles.errorText}>{submitError}</Text>}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Sending code…' : 'Next'}</Text>
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
  noAccountBox: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  linkText: {
    marginTop: 6,
    color: '#222',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
