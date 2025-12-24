import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { preferencesService } from '../../lib/services';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesService.getPreferences(),
  });

  const updatePreferences = useMutation({
    mutationFn: (data: any) => preferencesService.updatePreferences(data),
  });

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.accountEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Theme</Text>
          <Text style={styles.settingValue}>
            {preferences?.theme || 'Light'}
          </Text>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingLabel}>High Contrast</Text>
          <Switch
            value={preferences?.highContrast || false}
            onValueChange={(value) =>
              updatePreferences.mutate({ highContrast: value })
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Auto-scroll</Text>
          <Switch
            value={preferences?.autoScroll || false}
            onValueChange={(value) =>
              updatePreferences.mutate({ autoScroll: value })
            }
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>ChordKeeper v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  accountInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: '#666',
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40,
  },
});
