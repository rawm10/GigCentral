import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { preferencesService } from '../../lib/services';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

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

  const handleThemeSelect = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    setShowThemePicker(false);
  };

  const getThemeDisplayName = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  const styles = createStyles(theme);

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
        
        <TouchableOpacity 
          style={styles.setting}
          onPress={() => setShowThemePicker(true)}
        >
          <Text style={styles.settingLabel}>Theme</Text>
          <View style={styles.settingValueContainer}>
            <Text style={styles.settingValue}>{getThemeDisplayName()}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.setting}>
          <Text style={styles.settingLabel}>High Contrast</Text>
          <Switch
            value={preferences?.highContrast || false}
            onValueChange={(value) =>
              updatePreferences.mutate({ highContrast: value })
            }
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.surface}
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
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>StageReady v1.0.0</Text>

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Theme</Text>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'system' && styles.themeOptionSelected,
              ]}
              onPress={() => handleThemeSelect('system')}
            >
              <Text style={[
                styles.themeOptionText,
                themeMode === 'system' && styles.themeOptionTextSelected,
              ]}>
                System
              </Text>
              {themeMode === 'system' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'light' && styles.themeOptionSelected,
              ]}
              onPress={() => handleThemeSelect('light')}
            >
              <Text style={[
                styles.themeOptionText,
                themeMode === 'light' && styles.themeOptionTextSelected,
              ]}>
                Light
              </Text>
              {themeMode === 'light' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'dark' && styles.themeOptionSelected,
              ]}
              onPress={() => handleThemeSelect('dark')}
            >
              <Text style={[
                styles.themeOptionText,
                themeMode === 'dark' && styles.themeOptionTextSelected,
              ]}>
                Dark
              </Text>
              {themeMode === 'dark' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowThemePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginTop: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
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
    color: theme.colors.text,
  },
  accountEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  settingValue: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: theme.colors.surface,
    marginTop: 20,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    width: '80%',
    maxWidth: 400,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.background,
  },
  themeOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  themeOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  themeOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
