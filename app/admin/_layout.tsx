
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
