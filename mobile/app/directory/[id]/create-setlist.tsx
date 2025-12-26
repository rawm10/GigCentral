import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sheetService, setlistService } from '../../../lib/services';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';

export default function CreateSetlistScreen() {
  const { id: directoryId } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  
  const styles = createStyles(theme);

  const { data: sheets, isLoading } = useQuery({
    queryKey: ['sheets'],
    queryFn: () => sheetService.getSheets(),
  });

  const filteredSheets = sheets?.filter((sheet: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      sheet.title?.toLowerCase().includes(query) ||
      sheet.artist?.toLowerCase().includes(query) ||
      sheet.key?.toLowerCase().includes(query)
    );
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; sheetIds: string[] }) => {
      // First create the setlist
      const setlist = await setlistService.createSetlist(directoryId!, data.name);
      
      // Then add all selected sheets
      for (let i = 0; i < data.sheetIds.length; i++) {
        await setlistService.addItem(setlist.id, data.sheetIds[i], i);
      }
      
      return setlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory', directoryId] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Create Failed', error.response?.data?.error || 'Unable to create setlist');
    },
  });

  const toggleSheet = (sheetId: string) => {
    const newSelected = new Set(selectedSheets);
    if (newSelected.has(sheetId)) {
      newSelected.delete(sheetId);
    } else {
      newSelected.add(sheetId);
    }
    setSelectedSheets(newSelected);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a setlist name');
      return;
    }

    if (selectedSheets.size === 0) {
      Alert.alert('Error', 'Please select at least one song');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      sheetIds: Array.from(selectedSheets),
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.label}>Setlist Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Sunday Service, Wedding Ceremony"
          placeholderTextColor={theme.colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.sectionTitle}>
          Select Songs ({selectedSheets.size} selected)
        </Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, artist, or key..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredSheets}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => toggleSheet(item.id)}
            >
              <Ionicons
                name={selectedSheets.has(item.id) ? 'checkbox' : 'square-outline'}
                size={24}
                color={selectedSheets.has(item.id) ? theme.colors.primary : theme.colors.border}
              />
              <View style={styles.sheetInfo}>
                <Text style={styles.sheetTitle}>{item.title}</Text>
                {item.artist && (
                  <Text style={styles.sheetArtist}>{item.artist}</Text>
                )}
              </View>
              {item.key && (
                <View style={styles.keyBadge}>
                  <Text style={styles.keyText}>{item.key}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No songs in library</Text>
              <Text style={styles.emptySubtext}>Add some songs first</Text>
            </View>
          }
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createButton, createMutation.isPending && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          <Text style={styles.createButtonText}>
            {createMutation.isPending ? 'Creating...' : 'Create Setlist'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: theme.colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sheetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
  },
  sheetArtist: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  keyBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  keyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
    backgroundColor: theme.colors.surface,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.inputBackground,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  createButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
