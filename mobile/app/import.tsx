import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sheetService } from '../lib/services';
import { useTheme } from '../contexts/ThemeContext';

export default function ImportScreen() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [body, setBody] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [chordsOnly, setChordsOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [formattedPreview, setFormattedPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  
  const styles = createStyles(theme);

  const importMutation = useMutation({
    mutationFn: (data: any) => sheetService.importSheet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
      router.back();
    },
  });

  const handlePreview = async () => {
    if (!body.trim()) {
      Alert.alert('Error', 'Please enter chord sheet content to preview');
      return;
    }

    setIsPreviewing(true);
    try {
      // Call the formatter API to preview the formatting
      const response = await sheetService.previewFormat({
        body: body.trim(),
        chordsOnly,
        customInstructions: customInstructions.trim() || undefined,
      });
      
      setFormattedPreview(response.formattedBody || body);
      setShowPreview(true);
    } catch (error: any) {
      Alert.alert('Preview Failed', error.response?.data?.error || 'Unable to preview formatting');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a song title');
      return;
    }
    
    const contentToImport = showPreview && formattedPreview ? formattedPreview : body;
    
    if (!contentToImport.trim()) {
      Alert.alert('Error', 'Please enter the chord sheet content');
      return;
    }

    setIsLoading(true);
    try {
      // Build the source body with metadata
      let sourceBody = `{title: ${title}}\n`;
      if (artist) sourceBody += `{artist: ${artist}}\n`;
      if (key) sourceBody += `{key: ${key}}\n`;
      sourceBody += contentToImport.trim();
      
      await importMutation.mutateAsync({
        sourceType: 'text',
        body: sourceBody,
        useAI: false, // Already formatted if using preview
        chordsOnly: false,
      });
    } catch (error: any) {
      Alert.alert('Import Failed', error.response?.data?.error || 'Unable to import sheet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Song Information</Text>
          
          <Text style={styles.label}>Song Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter song title"
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Artist (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter artist name"
            placeholderTextColor={theme.colors.textSecondary}
            value={artist}
            onChangeText={setArtist}
          />

          <Text style={styles.label}>Key (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., C, G, Am"
            placeholderTextColor={theme.colors.textSecondary}
            value={key}
            onChangeText={setKey}
            autoCapitalize="characters"
          />

          <Text style={styles.sectionTitle}>Chord Sheet Content *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Paste your chord sheet here..."
            placeholderTextColor={theme.colors.textSecondary}
            value={body}
            onChangeText={(text) => {
              setBody(text);
              setShowPreview(false); // Reset preview when content changes
            }}
            multiline
            numberOfLines={15}
            textAlignVertical="top"
          />

          <Text style={styles.sectionTitle}>AI Formatting Options</Text>
          
          <View style={styles.optionRow}>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Chords Only</Text>
              <Text style={styles.optionDescription}>
                Extract and format only chords, remove lyrics
              </Text>
            </View>
            <Switch
              value={chordsOnly}
              onValueChange={setChordsOnly}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <Text style={styles.label}>Custom Instructions (Optional)</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="e.g., 'Add verse/chorus labels' or 'Show capo position'"
            placeholderTextColor={theme.colors.textSecondary}
            value={customInstructions}
            onChangeText={setCustomInstructions}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.previewButton, isPreviewing && styles.buttonDisabled]}
            onPress={handlePreview}
            disabled={isPreviewing}
          >
            {isPreviewing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Preview AI Formatting</Text>
            )}
          </TouchableOpacity>

          {showPreview && formattedPreview && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Formatted Preview</Text>
              <Text style={styles.previewHint}>
                You can edit the preview below before importing
              </Text>
              <TextInput
                style={styles.previewTextArea}
                value={formattedPreview}
                onChangeText={setFormattedPreview}
                multiline
                textAlignVertical="top"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          )}

          <Text style={styles.helpText}>
            {showPreview
              ? 'Preview looks good? Click "Import Sheet" below to save it.'
              : chordsOnly
              ? 'AI will extract and organize just the chords from your input.'
              : 'AI will format your chord sheet into a clean, easy-to-read layout with chords and lyrics.'}
          </Text>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleImport}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {showPreview ? 'Import Formatted Sheet' : 'Import Sheet'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
    color: theme.colors.text,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: theme.colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 250,
    marginBottom: 16,
    color: theme.colors.text,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionText: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  helpText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 60,
    color: theme.colors.text,
  },
  previewButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  previewContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  previewHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  previewTextArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 200,
    maxHeight: 400,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
