
import { Stack } from 'expo-router';

export default function PublicProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[slug]" />
    </Stack>
  );
}
