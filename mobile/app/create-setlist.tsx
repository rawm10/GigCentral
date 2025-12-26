import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sheetService, setlistService } from '../lib/services';
import { SheetSummary } from '../lib/services';
import { useTheme } from '../contexts/ThemeContext';

export default function CreateSetlistScreen() {
  const { directoryId, setlistId } = useLocalSearchParams<{ directoryId: string; setlistId?: string }>();
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  
  const styles = createStyles(theme);

  const isAddingToExisting = !!setlistId;

  const { data: sheets = [], isLoading: sheetsLoading } = useQuery({
    queryKey: ['sheets'],
    queryFn: () => sheetService.getSheets(1, 1000), // Get all sheets
  });

  const createSetlistMutation = useMutation({
    mutationFn: (setlistName: string) =>
      setlistService.createSetlist(directoryId!, setlistName),
    onSuccess: async (newSetlist) => {
      // Add selected sheets to the setlist
      const selectedArray = Array.from(selectedSheets);
      for (let i = 0; i < selectedArray.length; i++) {
        await setlistService.addItem(newSetlist.id, selectedArray[i], i);
      }
      queryClient.invalidateQueries({ queryKey: ['setlists', directoryId] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create setlist');
    },
  });

  const addToSetlistMutation = useMutation({
    mutationFn: async () => {
      const selectedArray = Array.from(selectedSheets);
      for (let i = 0; i < selectedArray.length; i++) {
        await setlistService.addItem(setlistId!, selectedArray[i]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlist', setlistId] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add songs');
    },
  });

  const filteredSheets = sheets.filter((sheet: SheetSummary) => {
    const searchLower = search.toLowerCase();
    return (
      sheet.title.toLowerCase().includes(searchLower) ||
      (sheet.artist && sheet.artist.toLowerCase().includes(searchLower)) ||
      (sheet.key && sheet.key.toLowerCase().includes(searchLower))
    );
  });

  const toggleSheet = (sheetId: string) => {
    const newSet = new Set(selectedSheets);
    if (newSet.has(sheetId)) {
      newSet.delete(sheetId);
    } else {
      newSet.add(sheetId);
    }
    setSelectedSheets(newSet);
  };

  const handleCreate = () => {
    if (isAddingToExisting) {
      addToSetlistMutation.mutate();
    } else {
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter a setlist name');
        return;
      }
      createSetlistMutation.mutate(name.trim());
    }
  };

  if (sheetsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isAddingToExisting ? 'Add Songs' : 'Create Setlist'}</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={createSetlistMutation.isPending || addToSetlistMutation.isPending}
          style={styles.saveButton}
        >
          {(createSetlistMutation.isPending || addToSetlistMutation.isPending) ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>{isAddingToExisting ? 'Add' : 'Create'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {!isAddingToExisting && (
          <>
            <Text style={styles.label}>Setlist Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter setlist name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Select Songs ({selectedSheets.size} selected)</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title, artist, or key..."
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <FlatList
        data={filteredSheets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sheetItem}
            onPress={() => toggleSheet(item.id)}
          >
            <View style={styles.checkbox}>
              {selectedSheets.has(item.id) && (
                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
              )}
            </View>
            <View style={styles.sheetInfo}>
              <Text style={styles.sheetTitle}>{item.title}</Text>
              {item.artist && (
                <Text style={styles.sheetArtist}>{item.artist}</Text>
              )}
              {item.key && (
                <Text style={styles.sheetKey}>Key: {item.key}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {search ? 'No songs match your search' : 'No songs in library'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingTop: 50,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  listContent: {
    padding: 16,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetInfo: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sheetArtist: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sheetKey: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
