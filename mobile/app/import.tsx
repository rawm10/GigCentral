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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sheetService } from '../lib/services';
import { useTheme } from '../contexts/ThemeContext';

export default function ImportScreen() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleImport = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a song title');
      return;
    }
    
    if (!body.trim()) {
      Alert.alert('Error', 'Please enter the chord sheet content');
      return;
    }

    setIsLoading(true);
    try {
      await importMutation.mutateAsync({
        sourceType: 'text',
        body: `{title: ${title}}\n${artist ? `{artist: ${artist}}\n` : ''}${key ? `{key: ${key}}\n` : ''}${body.trim()}`,
      });
    } catch (error: any) {
      Alert.alert('Import Failed', error.response?.data?.error || 'Unable to import sheet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.content}>
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

        <Text style={styles.label}>Chord Sheet Content *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Paste your chord sheet here..."
          placeholderTextColor={theme.colors.textSecondary}
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={15}
          textAlignVertical="top"
        />

        <Text style={styles.helpText}>
          Paste text with chords above lyrics, or ChordPro format.{'\n'}
          The formatter will automatically organize it.
        </Text>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleImport}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Importing...' : 'Import Sheet'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
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
    minHeight: 300,
    marginBottom: 8,
    color: theme.colors.text,
  },
  helpText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 18,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
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
