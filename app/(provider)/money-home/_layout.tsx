
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export default function MoneyHomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
