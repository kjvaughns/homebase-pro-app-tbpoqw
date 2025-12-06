
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as DocumentPicker from 'expo-image-picker'; // Using image picker as document picker alternative

export default function ImportCSVScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleFileSelect = () => {
    Alert.alert(
      'CSV Import',
      'CSV file import is not fully supported in this environment. You can manually add clients or use the web version for bulk imports.',
      [
        { text: 'OK' },
        {
          text: 'Add Manually',
          onPress: () => router.push('/(provider)/clients/add'),
        },
      ]
    );
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      Alert.alert('No Data', 'Please select a CSV file first');
      return;
    }

    try {
      setLoading(true);

      const clientsToImport = csvData.map((row) => ({
        organization_id: organization?.id,
        name: row[columnMapping.name] || 'Unknown',
        email: row[columnMapping.email] || null,
        phone: row[columnMapping.phone] || null,
        address: row[columnMapping.address] || null,
        status: 'lead',
        lifetime_value: 0,
      }));

      const { error } = await supabase.from('clients').insert(clientsToImport);

      if (error) throw error;

      Alert.alert('Success', `${clientsToImport.length} clients imported successfully`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error importing clients:', error);
      Alert.alert('Error', error.message || 'Failed to import clients');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Import Clients</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassView style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={32}
            color={colors.accent}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>CSV Format</Text>
            <Text style={styles.infoText}>
              Your CSV file should include columns for: Name, Email, Phone, and Address
            </Text>
          </View>
        </GlassView>

        <TouchableOpacity style={styles.uploadButton} onPress={handleFileSelect}>
          <IconSymbol
            ios_icon_name="doc.badge.plus"
            android_material_icon_name="upload-file"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.uploadText}>Select CSV File</Text>
          <Text style={styles.uploadSubtext}>Tap to browse files</Text>
        </TouchableOpacity>

        {csvData.length > 0 && (
          <React.Fragment>
            <GlassView style={styles.previewCard}>
              <Text style={styles.previewTitle}>Preview ({csvData.length} rows)</Text>
              <Text style={styles.previewText}>
                Map your CSV columns to client fields
              </Text>
            </GlassView>

            <TouchableOpacity
              style={[styles.importButton, loading && styles.importButtonDisabled]}
              onPress={handleImport}
              disabled={loading}
            >
              <Text style={styles.importButtonText}>
                {loading ? 'Importing...' : `Import ${csvData.length} Clients`}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        )}

        <GlassView style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Example CSV Format</Text>
          <View style={styles.exampleTable}>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleHeader}>Name</Text>
              <Text style={styles.exampleHeader}>Email</Text>
              <Text style={styles.exampleHeader}>Phone</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleCell}>John Doe</Text>
              <Text style={styles.exampleCell}>john@example.com</Text>
              <Text style={styles.exampleCell}>(555) 123-4567</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleCell}>Jane Smith</Text>
              <Text style={styles.exampleCell}>jane@example.com</Text>
              <Text style={styles.exampleCell}>(555) 987-6543</Text>
            </View>
          </View>
        </GlassView>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => router.push('/(provider)/clients/add')}
        >
          <IconSymbol
            ios_icon_name="person.badge.plus"
            android_material_icon_name="person-add"
            size={20}
            color={colors.text}
          />
          <Text style={styles.manualButtonText}>Add Client Manually</Text>
        </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: colors.glass,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  uploadSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  previewCard: {
    padding: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  importButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  exampleCard: {
    padding: 16,
    marginBottom: 24,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  exampleTable: {
    gap: 8,
  },
  exampleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exampleHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  exampleCell: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  manualButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});
