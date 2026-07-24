import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createUserProfile, verifyOtp } from './_auth-store';

// Matches the Email OTP length configured in the Supabase project (as
// stated by the project owner — not independently verified here, no
// auth-config-read tool was available to confirm it against the live
// project).
const OTP_LENGTH = 8;

type Mode = 'signup' | 'signin';

export default function OtpVerifyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { email, mode, name, dateOfBirth } = useLocalSearchParams<{
    email: string;
    mode: Mode;
    name?: string;
    dateOfBirth?: string;
  }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerify() {
    if (isSubmitting) return;

    const trimmedCode = code.trim();
    if (trimmedCode.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code we sent to ${email}.`);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const result = await verifyOtp(email, trimmedCode);

    if (result.error) {
      setIsSubmitting(false);
      setError(result.error);
      return;
    }

    if (result.userId) {
      queryClient.setQueryData(['session-user-id'], result.userId);
    }
    queryClient.invalidateQueries({ queryKey: ['taste-profile'] });

    if (mode === 'signup' && result.isNewUser) {
      const profileResult = await createUserProfile(name ?? '', dateOfBirth ?? '');
      setIsSubmitting(false);
      if (profileResult.error) {
        setError(profileResult.error);
        return;
      }
      router.replace('/q1');
      return;
    }

    if (mode === 'signup' && !result.isNewUser) {
      setIsSubmitting(false);
      setStatusMessage('Looks like you already have an account — signing you in.');
      setTimeout(() => router.replace('/'), 1200);
      return;
    }

    if (mode === 'signin' && !result.isNewUser) {
      setIsSubmitting(false);
      router.replace('/');
      return;
    }

    // mode === 'signin' && result.isNewUser — shouldn't normally happen,
    // since sendSignInOtp requires an existing account. Send them to signup
    // with the email pre-filled rather than attempting to handle it further.
    setIsSubmitting(false);
    router.replace({ pathname: '/signup', params: { email } });
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Text style={styles.label}>Enter your code</Text>
      <Text style={styles.subtitle}>We sent an {OTP_LENGTH}-digit code to {email}.</Text>

      <View style={styles.field}>
        <TextInput
          style={styles.input}
          placeholder={'0'.repeat(OTP_LENGTH)}
          value={code}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          onChangeText={(text) => {
            setCode(text.replace(/[^0-9]/g, ''));
            if (error) setError(null);
          }}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {statusMessage && <Text style={styles.statusText}>{statusMessage}</Text>}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Verifying…' : 'Verify'}</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 6,
    color: '#c0392b',
    fontSize: 13,
  },
  statusText: {
    marginBottom: 12,
    color: '#222',
    fontSize: 14,
    textAlign: 'center',
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
