import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { setlistService, sheetService } from '../../lib/services';
import { useTheme } from '../../contexts/ThemeContext';

interface SetlistItem {
  id: string;
  sheetId: string;
  position: number;
  title: string | null;
  artist: string | null;
  key: string | null;
}

export default function SetlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  
  const styles = createStyles(theme);

  const { data: setlist, isLoading } = useQuery({
    queryKey: ['setlist', id],
    queryFn: () => setlistService.getSetlist(id!),
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) =>
      setlistService.removeItem(id!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlist', id] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove item');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; position: number }[]) =>
      setlistService.reorderItems(id!, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlist', id] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reorder items');
    },
  });

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...(setlist?.items || [])];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    const reorderData = items.map((item, idx) => ({ id: item.id, position: idx }));
    reorderMutation.mutate(reorderData);
  };

  const handleMoveDown = (index: number) => {
    const items = [...(setlist?.items || [])];
    if (index === items.length - 1) return;
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    const reorderData = items.map((item, idx) => ({ id: item.id, position: idx }));
    reorderMutation.mutate(reorderData);
  };

  const handleRemoveItem = (itemId: string, title: string) => {
    Alert.alert('Remove Song', `Remove "${title}" from this setlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeItemMutation.mutate({ itemId }),
      },
    ]);
  };

  const handleAddSongs = () => {
    router.push(`/create-setlist?directoryId=${setlist?.directoryId}&setlistId=${id}`);
  };

  const handleViewSheet = (sheetId: string) => {
    router.push(`/sheet/${sheetId}`);
  };

  const renderItem = ({ item, index }: { item: SetlistItem; index: number }) => {
    return (
      <View style={styles.songItem}>
        <View style={styles.reorderButtons}>
          <TouchableOpacity
            onPress={() => handleMoveUp(index)}
            disabled={index === 0 || reorderMutation.isPending}
            style={[styles.arrowButton, index === 0 && styles.arrowButtonDisabled]}
          >
            <Ionicons name="chevron-up" size={20} color={index === 0 ? theme.colors.border : theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMoveDown(index)}
            disabled={index === (setlist?.items?.length ?? 0) - 1 || reorderMutation.isPending}
            style={[styles.arrowButton, index === (setlist?.items?.length ?? 0) - 1 && styles.arrowButtonDisabled]}
          >
            <Ionicons name="chevron-down" size={20} color={index === (setlist?.items?.length ?? 0) - 1 ? theme.colors.border : theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.songNumber}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>

        <TouchableOpacity
          style={styles.songInfo}
          onPress={() => handleViewSheet(item.sheetId)}
        >
          <Text style={styles.songTitle}>{item.title || 'Untitled'}</Text>
          {item.artist && (
            <Text style={styles.songArtist}>{item.artist}</Text>
          )}
          {item.key && (
            <Text style={styles.songKey}>Key: {item.key}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleRemoveItem(item.id, item.title || 'Untitled')}
          disabled={removeItemMutation.isPending}
          style={styles.removeButton}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!setlist) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Setlist not found</Text>
      </View>
    );
  }

  const items = setlist.items || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{setlist.name}</Text>
          <Text style={styles.subtitle}>{items.length} songs</Text>
        </View>
        <TouchableOpacity onPress={handleAddSongs} style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={64} color={theme.colors.border} />
          <Text style={styles.emptyText}>No songs in this setlist</Text>
          <TouchableOpacity onPress={handleAddSongs} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Add Songs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
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
  addButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
  },
  reorderButtons: {
    flexDirection: 'column',
    marginRight: 8,
  },
  arrowButton: {
    padding: 2,
  },
  arrowButtonDisabled: {
    opacity: 0.3,
  },
  songNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  songArtist: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  songKey: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
