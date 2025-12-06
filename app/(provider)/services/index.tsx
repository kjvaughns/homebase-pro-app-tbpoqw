
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { Service } from '@/types';

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      organization_id: '1',
      name: 'General Repairs',
      description: 'Fix various household issues',
      category: 'handyman',
      pricing_type: 'fixed',
      price_min: 75,
      duration: 60,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      organization_id: '1',
      name: 'Furniture Assembly',
      description: 'Professional furniture assembly',
      category: 'handyman',
      pricing_type: 'range',
      price_min: 50,
      price_max: 150,
      duration: 90,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const toggleServiceStatus = (serviceId: string) => {
    setServices(services.map(s => 
      s.id === serviceId ? { ...s, is_active: !s.is_active } : s
    ));
  };

  const getPriceDisplay = (service: Service) => {
    if (service.pricing_type === 'fixed') {
      return `$${service.price_min}`;
    } else if (service.pricing_type === 'range') {
      return `$${service.price_min} - $${service.price_max}`;
    } else {
      return 'Quote';
    }
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Services</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/(provider)/services/add')}
          >
            <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassView style={styles.statCard}>
            <Text style={styles.statValue}>{services.length}</Text>
            <Text style={styles.statLabel}>Total Services</Text>
          </GlassView>
          <GlassView style={styles.statCard}>
            <Text style={styles.statValue}>{services.filter(s => s.is_active).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </GlassView>
        </View>

        {/* AI Generator */}
        <TouchableOpacity 
          style={styles.aiButton}
          onPress={() => Alert.alert('AI Service Generator', 'Generate services based on your business type')}
        >
          <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto-awesome" size={20} color={colors.text} />
          <Text style={styles.aiButtonText}>Generate Services with AI</Text>
        </TouchableOpacity>

        {/* Service List */}
        <View style={styles.serviceList}>
          {services.map((service, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => router.push(`/(provider)/services/${service.id}`)}
            >
              <GlassView style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceCategory}>{service.category}</Text>
                  </View>
                  <Switch
                    value={service.is_active}
                    onValueChange={() => toggleServiceStatus(service.id)}
                    trackColor={{ false: colors.glass, true: colors.primary }}
                    thumbColor={colors.text}
                  />
                </View>
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
                <View style={styles.serviceFooter}>
                  <View style={styles.serviceDetail}>
                    <IconSymbol ios_icon_name="dollarsign.circle" android_material_icon_name="attach-money" size={16} color={colors.primary} />
                    <Text style={styles.serviceDetailText}>{getPriceDisplay(service)}</Text>
                  </View>
                  <View style={styles.serviceDetail}>
                    <IconSymbol ios_icon_name="clock" android_material_icon_name="schedule" size={16} color={colors.textSecondary} />
                    <Text style={styles.serviceDetailText}>{service.duration} min</Text>
                  </View>
                </View>
              </GlassView>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: 24,
    gap: 8,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  serviceList: {
    gap: 12,
  },
  serviceCard: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 13,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  serviceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    gap: 20,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceDetailText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
