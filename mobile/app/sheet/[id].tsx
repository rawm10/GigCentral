import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sheetService } from '../../lib/services';
import { Ionicons } from '@expo/vector-icons';
import { KeepAwake } from 'expo-keep-awake';
import { useTheme } from '../../contexts/ThemeContext';

export default function SheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [performanceMode, setPerformanceMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  
  const styles = createStyles(theme);

  const { data: sheet, isLoading } = useQuery({
    queryKey: ['sheet', id],
    queryFn: () => sheetService.getSheet(id!),
    enabled: !!id,
  });

  const transposeMutation = useMutation({
    mutationFn: ({ semitones, useNashville }: { semitones: number; useNashville: boolean }) =>
      sheetService.transposeSheet(id!, semitones, useNashville),
    onSuccess: (data) => {
      console.log('Transpose success, new data:', data);
      queryClient.invalidateQueries({ queryKey: ['sheet', id] });
    },
    onError: (error) => {
      console.error('Transpose error:', error);
      Alert.alert('Transpose Failed', 'Unable to transpose sheet');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => sheetService.deleteSheet(id!),
    onSuccess: () => {
      router.back();
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
    },
  });

  const handleTranspose = (semitones: number) => {
    transposeMutation.mutate({ semitones, useNashville: false });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Sheet',
      'Are you sure you want to delete this sheet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading || !sheet) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {performanceMode && <KeepAwake />}
      
      {!performanceMode && (
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{sheet.title}</Text>
            {sheet.artist && <Text style={styles.artist}>{sheet.artist}</Text>}
            <View style={styles.metadata}>
              {sheet.key && <Text style={styles.metaText}>Key: {sheet.key}</Text>}
              {sheet.capo && <Text style={styles.metaText}>Capo: {sheet.capo}</Text>}
            </View>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => router.push(`/sheet/${id}/edit`)} style={styles.actionButton}>
              <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTranspose(1)} style={styles.actionButton}>
              <Ionicons name="arrow-up" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTranspose(-1)} style={styles.actionButton}>
              <Ionicons name="arrow-down" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.content}
        contentContainerStyle={performanceMode && styles.performanceContent}
      >
        <Text style={[styles.body, { fontSize: performanceMode ? fontSize * 1.5 : fontSize }]}>
          {renderChordPro(sheet.body)}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.performanceButton}
          onPress={() => setPerformanceMode(!performanceMode)}
        >
          <Ionicons 
            name={performanceMode ? 'exit-outline' : 'play'} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.performanceButtonText}>
            {performanceMode ? 'Exit Performance' : 'Performance Mode'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function renderChordPro(body: string): string {
  // Basic ChordPro rendering - in production, use a proper parser
  return body
    .replace(/\{title:\s*(.+?)\}/gi, '')
    .replace(/\{artist:\s*(.+?)\}/gi, '')
    .replace(/\{key:\s*(.+?)\}/gi, '')
    .replace(/\{capo:\s*(.+?)\}/gi, '')
    .replace(/^\s*$/gm, '') // Remove empty lines
    .replace(/\[([^\]]+)\]/g, '$1') // Display chords inline for now
    .trim();
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerInfo: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text,
  },
  artist: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  performanceContent: {
    padding: 24,
  },
  body: {
    fontFamily: 'monospace',
    lineHeight: 24,
    padding: 16,
    color: theme.colors.text,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  performanceButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  performanceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
