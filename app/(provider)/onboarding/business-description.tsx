
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useLLM } from '@/hooks/useLLM';
import { useAuth } from '@/contexts/AuthContext';

export default function BusinessDescription() {
  const router = useRouter();
  const { organization } = useAuth();
  const { generateText, loading } = useLLM();
  const [description, setDescription] = useState('');

  const handleGenerateAI = async () => {
    if (!organization) {
      Alert.alert('Error', 'Organization not found');
      return;
    }

    try {
      const prompt = `Generate a professional business description for a ${organization.service_categories.join(', ')} service provider named "${organization.business_name}". The description should be engaging, highlight expertise, and emphasize customer satisfaction. Keep it to 2-3 sentences.`;

      const result = await generateText({
        prompt,
        system: 'You are a professional business copywriter specializing in home service businesses.',
        temperature: 0.7,
        max_tokens: 200,
      });

      if (result?.text) {
        setDescription(result.text.trim());
      }
    } catch (error) {
      console.error('Error generating description:', error);
      Alert.alert('Error', 'Failed to generate description. Please try again.');
    }
  };

  const handleNext = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter or generate a business description');
      return;
    }

    console.log('Business description:', description);
    router.push('/(provider)/onboarding/services-setup');
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '50%' }]} />
        </View>
      </View>

      <Text style={styles.title}>Tell us about your business</Text>
      <Text style={styles.subtitle}>Step 2 of 4</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Business Description</Text>
        <Text style={styles.hint}>This will be shown to potential customers</Text>
        <TextInput
          style={[commonStyles.input, styles.textArea]}
          placeholder="Describe your business, services, and what makes you unique..."
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity 
        style={styles.aiButton} 
        onPress={handleGenerateAI}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto-awesome" size={20} color={colors.accent} />
            <Text style={styles.aiButtonText}>Generate with AI</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continue</Text>
          <IconSymbol ios_icon_name="arrow.right" android_material_icon_name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  progress: {
    height: 4,
    backgroundColor: colors.glass,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  textArea: {
    height: 160,
    paddingTop: 16,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: 32,
    gap: 8,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
