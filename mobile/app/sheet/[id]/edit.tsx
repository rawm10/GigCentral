import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sheetService } from '../../../lib/services';
import { useTheme } from '../../../contexts/ThemeContext';

export default function EditSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const styles = createStyles(theme);

  const { data: sheet, isLoading: isLoadingSheet } = useQuery({
    queryKey: ['sheet', id],
    queryFn: () => sheetService.getSheet(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (sheet) {
      setTitle(sheet.title);
      setArtist(sheet.artist || '');
      setKey(sheet.key || '');
      // Remove ChordPro metadata from body for editing
      const cleanBody = sheet.body
        .replace(/\{title:\s*(.+?)\}\n?/g, '')
        .replace(/\{artist:\s*(.+?)\}\n?/g, '')
        .replace(/\{key:\s*(.+?)\}\n?/g, '');
      setBody(cleanBody);
    }
  }, [sheet]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => sheetService.updateSheet(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet', id] });
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
      router.back();
    },
  });

  const handleSave = async () => {
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
      // Reconstruct ChordPro format with metadata
      const chordProBody = `{title: ${title}}\n${artist ? `{artist: ${artist}}\n` : ''}${key ? `{key: ${key}}\n` : ''}${body.trim()}`;
      
      await updateMutation.mutateAsync({
        title,
        artist: artist || null,
        key: key || null,
        body: chordProBody,
      });
    } catch (error: any) {
      Alert.alert('Update Failed', error.response?.data?.error || 'Unable to update sheet');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingSheet) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    minHeight: 300,
    color: theme.colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: theme.colors.inputBackground,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
