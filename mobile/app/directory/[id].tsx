import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { directoryService, setlistService } from '../../lib/services';
import { Ionicons } from '@expo/vector-icons';

export default function DirectoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: directory, isLoading: directoryLoading } = useQuery({
    queryKey: ['directory', id],
    queryFn: () => directoryService.getDirectory(id!),
    enabled: !!id,
  });

  const { data: setlists, isLoading: setlistsLoading } = useQuery({
    queryKey: ['setlists', id],
    queryFn: () => setlistService.getSetlistsByDirectory(id!),
    enabled: !!id,
  });

  if (directoryLoading || setlistsLoading || !directory) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{directory.name}</Text>
        {directory.description && (
          <Text style={styles.description}>{directory.description}</Text>
        )}
      </View>

      <FlatList
        data={setlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.setlistItem}
            onPress={() => router.push(`/setlist/${item.id}`)}
          >
            <Ionicons name="list" size={24} color="#007AFF" />
            <View style={styles.setlistInfo}>
              <Text style={styles.setlistName}>{item.name}</Text>
              <Text style={styles.setlistCount}>
                {item.items?.length || 0} song{item.items?.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No setlists yet</Text>
            <Text style={styles.emptySubtext}>Create a setlist to organize your songs</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/create-setlist?directoryId=${id}`)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  setlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  setlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  setlistName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  setlistCount: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
