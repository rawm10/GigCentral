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
import { directoryService } from '../../lib/services';
import { Ionicons } from '@expo/vector-icons';

export default function SetlistsScreen() {
  const router = useRouter();
  const { data: directories, isLoading } = useQuery({
    queryKey: ['directories'],
    queryFn: () => directoryService.getDirectories(),
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
        data={directories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.directoryItem}
            onPress={() => router.push(`/directory/${item.id}`)}
          >
            <Ionicons name="folder" size={24} color="#007AFF" />
            <View style={styles.directoryInfo}>
              <Text style={styles.directoryName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.directoryDescription}>
                  {item.description}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No gigs yet</Text>
            <Text style={styles.emptySubtext}>Create a directory to organize your setlists</Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-directory')}
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
  directoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  directoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  directoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  directoryDescription: {
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
