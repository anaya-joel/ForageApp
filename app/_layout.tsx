import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="explore" options={{ animation: 'none' }} />
      <Stack.Screen name="friends" options={{ animation: 'none' }} />
      <Stack.Screen name="profile" options={{ animation: 'none' }} />
      <Stack.Screen name="outing-questions" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="drafts" options={{ animation: 'default' }} />
      <Stack.Screen name="outing-history" options={{ animation: 'default' }} />
      <Stack.Screen name="preferences" options={{ animation: 'default' }} />
      <Stack.Screen name="q1" options={{ animation: 'default' }} />
      <Stack.Screen name="q2" options={{ animation: 'default' }} />
      <Stack.Screen name="q3" options={{ animation: 'default' }} />
      <Stack.Screen name="q4" options={{ animation: 'default' }} />
      <Stack.Screen name="q5" options={{ animation: 'default' }} />
      <Stack.Screen
        name="outing-preview"
        options={({ route }) => {
          if (route.params?.draftId) return { animation: 'default' };
          if (route.params?.fromQuestions) return { animation: 'default' };
          return { animation: 'slide_from_bottom' };
        }}
      />
    </Stack>
  );
}
