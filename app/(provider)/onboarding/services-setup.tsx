
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from '@/components/GlassView';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
}

export default function ServicesSetup() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);

  const handleGenerateServices = async () => {
    setIsGenerating(true);
    // Simulate AI generation - in production, call your AI service
    setTimeout(() => {
      const generatedServices: ServiceItem[] = [
        {
          id: '1',
          name: 'General Repairs',
          description: 'Fix various household issues including doors, windows, and fixtures',
          price: '75',
          duration: '60',
        },
        {
          id: '2',
          name: 'Furniture Assembly',
          description: 'Professional assembly of furniture and equipment',
          price: '50',
          duration: '45',
        },
        {
          id: '3',
          name: 'Painting Services',
          description: 'Interior and exterior painting with quality materials',
          price: '150',
          duration: '240',
        },
      ];
      setServices(generatedServices);
      setIsGenerating(false);
    }, 2000);
  };

  const handleAddService = () => {
    const newService: ServiceItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: '',
      duration: '',
    };
    setServices([...services, newService]);
    setEditingService(newService.id);
  };

  const handleUpdateService = (id: string, field: keyof ServiceItem, value: string) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const handleNext = () => {
    if (services.length === 0) {
      Alert.alert('Error', 'Please add at least one service or generate services with AI');
      return;
    }

    const invalidServices = services.filter(s => !s.name.trim() || !s.price.trim());
    if (invalidServices.length > 0) {
      Alert.alert('Error', 'Please fill in all service names and prices');
      return;
    }

    console.log('Services:', services);
    router.push('/(provider)/onboarding/logo-upload');
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '75%' }]} />
        </View>
      </View>

      <Text style={styles.title}>Set up your services</Text>
      <Text style={styles.subtitle}>Step 3 of 4</Text>

      {services.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol ios_icon_name="wrench.and.screwdriver" android_material_icon_name="build" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No services added yet</Text>
          <Text style={styles.emptyHint}>Generate services with AI or add manually</Text>
        </View>
      ) : (
        <View style={styles.servicesList}>
          {services.map((service, index) => (
            <GlassView key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceNumber}>Service {index + 1}</Text>
                <TouchableOpacity onPress={() => handleDeleteService(service.id)}>
                  <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.serviceInput}
                placeholder="Service name"
                placeholderTextColor={colors.textSecondary}
                value={service.name}
                onChangeText={(text) => handleUpdateService(service.id, 'name', text)}
              />
              <TextInput
                style={[styles.serviceInput, styles.textArea]}
                placeholder="Description"
                placeholderTextColor={colors.textSecondary}
                value={service.description}
                onChangeText={(text) => handleUpdateService(service.id, 'description', text)}
                multiline
                numberOfLines={3}
              />
              <View style={styles.serviceRow}>
                <View style={styles.serviceInputContainer}>
                  <Text style={styles.inputLabel}>Price ($)</Text>
                  <TextInput
                    style={styles.serviceInputSmall}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={service.price}
                    onChangeText={(text) => handleUpdateService(service.id, 'price', text)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.serviceInputContainer}>
                  <Text style={styles.inputLabel}>Duration (min)</Text>
                  <TextInput
                    style={styles.serviceInputSmall}
                    placeholder="60"
                    placeholderTextColor={colors.textSecondary}
                    value={service.duration}
                    onChangeText={(text) => handleUpdateService(service.id, 'duration', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </GlassView>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.aiButton} 
          onPress={handleGenerateServices}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto-awesome" size={20} color={colors.text} />
              <Text style={styles.aiButtonText}>Generate with AI</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={handleAddService}>
          <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={20} color={colors.text} />
          <Text style={styles.addButtonText}>Add Service Manually</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>Continue</Text>
        <IconSymbol ios_icon_name="arrow.right" android_material_icon_name="arrow-forward" size={20} color={colors.text} />
      </TouchableOpacity>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  servicesList: {
    marginBottom: 24,
  },
  serviceCard: {
    padding: 16,
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  serviceInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  serviceInputSmall: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 15,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
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
    gap: 8,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
