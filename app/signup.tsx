import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { sendSignUpOtp } from './_auth-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_AGE = 17;

function parseDateOfBirth(raw: string): Date | null {
  if (!DOB_RE.test(raw)) return null;
  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date rolls invalid components (e.g. 2020-02-30) forward instead of
  // failing, so round-tripping the parts is what actually catches them.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

function calculateAge(dob: Date, now: Date): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export default function SignupScreen() {
  const router = useRouter();
  // Prefilled when otp-verify redirects here after a signin attempt on an
  // email with no account yet (mode: 'signin' + isNewUser: true edge case).
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(emailParam ?? '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleNext() {
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedDob = dateOfBirth.trim();

    const hasNameError = !trimmedName;
    const hasEmailError = !EMAIL_RE.test(trimmedEmail);

    let dobErrorMessage: string | null = null;
    const parsedDob = parseDateOfBirth(trimmedDob);
    if (!parsedDob) {
      dobErrorMessage = 'Enter your date of birth as YYYY-MM-DD.';
    } else if (calculateAge(parsedDob, new Date()) < MIN_AGE) {
      dobErrorMessage = `You need to be ${MIN_AGE}+ to use Forage.`;
    }

    setNameError(hasNameError);
    setEmailError(hasEmailError);
    setDobError(dobErrorMessage);
    setSubmitError(null);

    if (hasNameError || hasEmailError || dobErrorMessage) return;

    setIsSubmitting(true);
    const { error } = await sendSignUpOtp(trimmedEmail);
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    router.push({
      pathname: '/otp-verify',
      params: { email: trimmedEmail, mode: 'signup', name: trimmedName, dateOfBirth: trimmedDob },
    });
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
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError(false);
          }}
        />
        {emailError && <Text style={styles.errorText}>Enter a valid email address</Text>}
      </View>
      <View style={styles.field}>
        {/* No cross-platform (incl. web) date picker is installed —
            @expo/ui's DatePicker is iOS/Android-only via separate
            swift-ui/jetpack-compose imports with no web support, and
            @react-native-community/datetimepicker isn't installed. Plain
            YYYY-MM-DD text entry as an interim approach. */}
        <TextInput
          style={styles.input}
          placeholder="Date of birth (YYYY-MM-DD)"
          value={dateOfBirth}
          keyboardType="numbers-and-punctuation"
          onChangeText={(text) => {
            setDateOfBirth(text);
            if (dobError) setDobError(null);
          }}
        />
        {dobError && <Text style={styles.errorText}>{dobError}</Text>}
      </View>
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
