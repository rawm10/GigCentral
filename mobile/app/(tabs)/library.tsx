import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { sheetService } from '../../lib/services';
import { Ionicons } from '@expo/vector-icons';

export default function LibraryScreen() {
  const router = useRouter();
  const { data: sheets, isLoading } = useQuery({
    queryKey: ['sheets'],
    queryFn: () => sheetService.getSheets(),
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sheets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sheetItem}
            onPress={() => router.push(`/sheet/${item.id}`)}
          >
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
            <Ionicons name="musical-notes-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No sheets yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first song</Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/import')}
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
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sheetInfo: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sheetArtist: {
    fontSize: 14,
    color: '#666',
  },
  keyBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  keyText: {
    color: '#fff',
    fontWeight: '600',
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
