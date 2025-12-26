import React, { useState, useRef } from 'react';
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
  Switch,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sheetService } from '../lib/services';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';


type TabType = 'manual' | 'search';

interface SongsterrSearchResult {
  songId: number;
  artistId: number;
  artist: string;
  title: string;
  hasChords: boolean;
  hasPlayer: boolean;
  tracks?: Array<{
    instrumentId: number;
    instrument: string;
    views: number;
    name: string;
    tuning: number[];
    difficulty?: number;
    hash: string;
  }>;
  defaultTrack?: number;
  popularTrack?: number;
}

interface SearchResult {
  songId: number;
  artistId: number;
  artist: string;
  title: string;
  hasChords: boolean;
  instrumentInfo?: string;
  trackCount?: number;
  difficulty?: number;
  views?: number;
  trackHash?: string;
}

export default function ImportScreen() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  
  // Manual entry state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [capo, setCapo] = useState('');
  const [body, setBody] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [chordsOnly, setChordsOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [formattedPreview, setFormattedPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'title' | 'artist'>('popularity');
  const [artistFilter, setArtistFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [rawSearchResults, setRawSearchResults] = useState<SearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewHasError, setPreviewHasError] = useState(false);
  
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  
  const styles = createStyles(theme);

  const importMutation = useMutation({
    mutationFn: (data: any) => sheetService.importSheet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
      router.back();
    },
  });

  const applyFiltersAndSort = () => {
    let filtered = [...rawSearchResults];

    // Filter by instrument - always filter to only show guitar, bass, or drums
    filtered = filtered.filter(result => {
      if (!result.instrumentInfo) return false;
      const instrumentLower = result.instrumentInfo.toLowerCase();
      
      // Check if it's one of our supported instruments
      const isGuitar = instrumentLower.includes('guitar') && !instrumentLower.includes('bass');
      const isBass = instrumentLower.includes('bass');
      const isDrums = instrumentLower.includes('drum');
      
      // If 'all' is selected, show all supported instruments
      if (instrumentFilter === 'all') {
        return isGuitar || isBass || isDrums;
      }
      
      // Otherwise filter by specific instrument
      switch (instrumentFilter) {
        case 'guitar':
          return isGuitar;
        case 'bass':
          return isBass;
        case 'drums':
          return isDrums;
        default:
          return true;
      }
    });

    // Filter by artist
    if (artistFilter.trim()) {
      filtered = filtered.filter(result => 
        result.artist.toLowerCase().includes(artistFilter.toLowerCase())
      );
    }

    // Sort results
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'artist':
        filtered.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
    }

    setSearchResults(filtered);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      // Build instrument parameter
      const instParam = instrumentFilter === 'all' ? 'undefined' : instrumentFilter;
      
      // Call Songsterr API
      const response = await fetch(
        `https://www.songsterr.com/api/search?pattern=${encodeURIComponent(searchQuery)}&inst=${instParam}&tuning=undefined&difficulty=undefined&size=50&from=0&more=true`
      );
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      
      // Filter results to only include songs with chords
      let filteredRecords = data.records.filter((song: SongsterrSearchResult) => song.hasChords);
      
      // Filter results based on instrument selection
      if (instrumentFilter !== 'all') {
        filteredRecords = data.records.filter((song: SongsterrSearchResult) => {
          if (!song.tracks || song.tracks.length === 0) return false;
          
          // Check if any track matches the selected instrument type
          return song.tracks.some(track => {
            const instrumentLower = track.instrument.toLowerCase();
            
            switch (instrumentFilter) {
              case 'guitar':
                return instrumentLower.includes('guitar') && !instrumentLower.includes('bass');
              case 'bass':
                return instrumentLower.includes('bass');
              case 'drums':
                return instrumentLower.includes('drum');
              default:
                return true;
            }
          });
        });
      }
      
      // Transform Songsterr results to our SearchResult format
      let transformedResults: SearchResult[] = filteredRecords.map((song: SongsterrSearchResult) => {
        // Get all tracks for this song
        let primaryTrack = song.tracks?.[0];
        
        return {
          songId: song.songId,
          artistId: song.artistId,
          artist: song.artist,
          title: song.title,
          hasChords: song.hasChords,
          instrumentInfo: primaryTrack?.instrument,
          trackCount: song.tracks?.length || 0,
          difficulty: primaryTrack?.difficulty,
          views: primaryTrack?.views || 0,
          trackHash: primaryTrack?.hash,
        };
      });
      
      // Store raw results and reset filters
      setRawSearchResults(transformedResults);
      setInstrumentFilter('all');
      setArtistFilter('');
      setSortBy('popularity');
      
      // Sort by popularity by default
      transformedResults.sort((a, b) => (b.views || 0) - (a.views || 0));
      
      setSearchResults(transformedResults);
      
      if (transformedResults.length === 0) {
        Alert.alert('No Results', 'No songs found matching your search.');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Search Failed', error.message || 'Unable to search for songs');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (result: SearchResult) => {
    setSelectedResult(result);
    setShowPreviewModal(true);
    setIsLoadingPreview(true);
    setPreviewHasError(false);
    
    try {
      console.log('Fetching chords for song:', result.songId, result.title);
      
      // Step 1: Get chordpro metadata
      const metaUrl = `https://www.songsterr.com/api/chords/${result.songId}`;
      console.log('Fetching metadata from:', metaUrl);
      
      const metaResponse = await fetch(metaUrl);
      
      if (!metaResponse.ok) {
        // If chord metadata not available, show a helpful message
        if (metaResponse.status === 404) {
          console.log('Chord metadata not available (404) for song:', result.songId);
          const fallbackContent = `Chord preview not available for this song.

This song may only have tablature (guitar tabs) available on Songsterr, not chord notation.

You can try:
• Searching for a different version of this song
• Using the Manual Entry tab to add chords manually
• Visiting Songsterr.com directly to view the tablature`;
          
          setPreviewContent(fallbackContent);
          setPreviewHasError(true);
          setIsLoadingPreview(false);
          return;
        }
        
        throw new Error(`Failed to fetch chord metadata: ${metaResponse.status}`);
      }
      
      const metadata = await metaResponse.json();
      console.log('Metadata received:', metadata);
      
      const { chordpro, chordsRevisionId } = metadata;
      
      if (!chordpro || !chordsRevisionId) {
        throw new Error('Missing chordpro data in response');
      }
      
      // Step 2: Fetch the actual chordpro content
      const contentUrl = `https://chordpro2.songsterr.com/${result.songId}/${chordsRevisionId}/${chordpro}.chordpro`;
      console.log('Fetching content from:', contentUrl);
      
      const chordproResponse = await fetch(contentUrl);
      
      if (!chordproResponse.ok) {
        console.error('Content fetch failed:', chordproResponse.status, chordproResponse.statusText);
        throw new Error(`Failed to fetch chord content: ${chordproResponse.status}`);
      }
      
      const chordContent = await chordproResponse.text();
      console.log('Chord content received, length:', chordContent.length);
      
      // Add metadata to the content
      const fullContent = `{title: ${result.title}}
{artist: ${result.artist}}

${chordContent}`;
      
      setPreviewContent(fullContent);
    } catch (error: any) {
      console.error('Preview error:', error);
      const errorMessage = error.message || 'Unable to load chord preview from Songsterr';
      setPreviewContent(errorMessage);
      setPreviewHasError(true);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleImportFromSearch = async () => {
    if (!selectedResult) {
      Alert.alert('Error', 'Please select a song to import');
      return;
    }

    setIsLoading(true);
    try {
      // Use the preview content if available, otherwise use placeholder
      const contentToImport = previewContent || `{title: ${selectedResult.title}}\n{artist: ${selectedResult.artist}}\n\nChord content from Songsterr`;
      
      await importMutation.mutateAsync({
        sourceType: 'text',
        body: contentToImport,
        useAI: false,
        chordsOnly: false,
      });
      
      // Close modal and reset on success
      setShowPreviewModal(false);
      setSelectedResult(null);
      setPreviewContent('');
    } catch (error: any) {
      Alert.alert('Import Failed', error.response?.data?.error || 'Unable to import sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewFromSearch = () => {
    if (!selectedResult) {
      Alert.alert('Error', 'Please select a song to import');
      return;
    }

    // Extract metadata from ChordPro content and clean body
    let extractedKey = '';
    let extractedCapo = '';
    let cleanedBody = '';
    
    if (previewContent) {
      const keyMatch = previewContent.match(/\{key:\s*([^}]+)\}/i);
      const capoMatch = previewContent.match(/\{capo:\s*(\d+)\}/i);
      const tuningMatch = previewContent.match(/\{tuning:\s*([^}]+)\}/i);
      
      if (keyMatch) extractedKey = keyMatch[1].trim();
      if (capoMatch) extractedCapo = capoMatch[1].trim();

      // Remove title, artist, key, and capo metadata from body
      cleanedBody = previewContent
        .replace(/\{title:\s*[^}]+\}\n?/gi, '')
        .replace(/\{artist:\s*[^}]+\}\n?/gi, '')
        .replace(/\{key:\s*[^}]+\}\n?/gi, '')
        .replace(/\{capo:\s*\d+\}\n?/gi, '')
        .trim();

      // Format tuning in a more user-friendly way
      if (tuningMatch) {
        const tuning = tuningMatch[1].trim();
        cleanedBody = cleanedBody.replace(
          /\{tuning:\s*[^}]+\}/i,
          `Tuning: ${tuning}`
        );
      }
    }

    // Populate manual entry fields
    setTitle(selectedResult.title);
    setArtist(selectedResult.artist);
    setKey(extractedKey);
    setCapo(extractedCapo);
    setBody(cleanedBody || 'Chord content from Songsterr');

    // Close modal and switch to manual entry tab
    setShowPreviewModal(false);
    setActiveTab('manual');
    setSelectedResult(null);
    setPreviewContent('');
  };

  const handlePreview = async () => {
    if (!body.trim()) {
      Alert.alert('Error', 'Please enter chord sheet content to preview');
      return;
    }

    setIsPreviewing(true);
    try {
      // Call the formatter API to preview the formatting
      const response = await sheetService.previewFormat({
        body: body.trim(),
        chordsOnly,
        customInstructions: customInstructions.trim() || undefined,
      });
      
      setFormattedPreview(response.formattedBody || body);
      setShowPreview(true);
    } catch (error: any) {
      Alert.alert('Preview Failed', error.response?.data?.error || 'Unable to preview formatting');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a song title');
      return;
    }
    
    const contentToImport = showPreview && formattedPreview ? formattedPreview : body;
    
    if (!contentToImport.trim()) {
      Alert.alert('Error', 'Please enter the chord sheet content');
      return;
    }

    setIsLoading(true);
    try {
      // Build the source body with metadata
      let sourceBody = `{title: ${title}}\n`;
      if (artist) sourceBody += `{artist: ${artist}}\n`;
      if (key) sourceBody += `{key: ${key}}\n`;
      if (capo) sourceBody += `{capo: ${capo}}\n`;
      sourceBody += contentToImport.trim();
      
      await importMutation.mutateAsync({
        sourceType: 'text',
        body: sourceBody,
        useAI: false, // Already formatted if using preview
        chordsOnly: false,
      });
    } catch (error: any) {
      Alert.alert('Import Failed', error.response?.data?.error || 'Unable to import sheet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
            onPress={() => setActiveTab('manual')}
          >
            <Ionicons 
              name="create-outline" 
              size={20} 
              color={activeTab === 'manual' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'manual' && styles.tabTextActive
            ]}>
              Manual Entry
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.tabActive]}
            onPress={() => setActiveTab('search')}
          >
            <Ionicons 
              name="search-outline" 
              size={20} 
              color={activeTab === 'search' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'search' && styles.tabTextActive
            ]}>
              Search Songs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'manual' ? renderManualEntry() : renderSearch()}
      </KeyboardAvoidingView>

      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Preview Chords</Text>
            <View style={{ width: 28 }} />
          </View>

          {isLoadingPreview ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.modalLoadingText}>Loading chord preview...</Text>
            </View>
          ) : (
            <>
              {selectedResult && (
                <View style={styles.previewInfo}>
                  <Text style={styles.previewTitle}>{selectedResult.title}</Text>
                  <Text style={styles.previewArtist}>{selectedResult.artist}</Text>
                  <View style={styles.previewMeta}>
                    {selectedResult.instrumentInfo && (
                      <Text style={styles.previewMetaText}>
                        <Ionicons name="musical-note" size={14} color={theme.colors.textSecondary} />
                        {' '}{selectedResult.instrumentInfo}
                      </Text>
                    )}
                    {selectedResult.difficulty !== undefined && (
                      <Text style={styles.previewMetaText}>
                        <Ionicons name="star" size={14} color={theme.colors.primary} />
                        {' '}{selectedResult.difficulty}/10
                      </Text>
                    )}
                    {selectedResult.views !== undefined && (
                      <Text style={styles.previewMetaText}>
                        <Ionicons name="eye-outline" size={14} color={theme.colors.textSecondary} />
                        {' '}{selectedResult.views >= 1000000 
                          ? `${(selectedResult.views / 1000000).toFixed(1)}M` 
                          : selectedResult.views >= 1000 
                          ? `${(selectedResult.views / 1000).toFixed(1)}K` 
                          : selectedResult.views}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <ScrollView style={styles.previewContentContainer}>
                <Text style={styles.previewContentText}>{previewContent}</Text>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={previewHasError ? styles.modalCancelButtonFull : styles.modalCancelButton}
                  onPress={() => setShowPreviewModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>{previewHasError ? 'Close' : 'Cancel'}</Text>
                </TouchableOpacity>
                {!previewHasError && (
                  <>
                    <TouchableOpacity
                      style={styles.modalReviewButton}
                      onPress={handleReviewFromSearch}
                    >
                      <Text style={styles.modalReviewButtonText}>Review</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalImportButton, isLoading && styles.buttonDisabled]}
                      onPress={handleImportFromSearch}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.modalImportButtonText}>Import</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );

  function renderManualEntry() {
    return (
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Song Information</Text>
          
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
          <Pressable 
            onPress={() => setShowKeyPicker(true)}
            style={styles.pickerButton}
          >
            <Text style={[styles.pickerButtonText, !key && styles.placeholderText]}>
              {key || 'Select a key...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.text} />
          </Pressable>

          <Modal
            visible={showKeyPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowKeyPicker(false)}
          >
            <View style={styles.keyPickerOverlay}>
              <View style={styles.keyPickerModal}>
                <View style={styles.keyPickerHeader}>
                  <Text style={styles.keyPickerTitle}>Select Key</Text>
                  <TouchableOpacity onPress={() => setShowKeyPicker(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.keyPickerScroll}>
                  <Pressable
                    style={styles.keyPickerItem}
                    onPress={() => {
                      setKey('');
                      setShowKeyPicker(false);
                    }}
                  >
                    <Text style={[styles.keyPickerItemText, styles.placeholderText]}>
                      No key
                    </Text>
                  </Pressable>
                  {[
                    { label: 'C', value: 'C' },
                    { label: 'C#/Db', value: 'C#' },
                    { label: 'D', value: 'D' },
                    { label: 'D#/Eb', value: 'Eb' },
                    { label: 'E', value: 'E' },
                    { label: 'F', value: 'F' },
                    { label: 'F#/Gb', value: 'F#' },
                    { label: 'G', value: 'G' },
                    { label: 'G#/Ab', value: 'Ab' },
                    { label: 'A', value: 'A' },
                    { label: 'A#/Bb', value: 'Bb' },
                    { label: 'B', value: 'B' },
                    { label: 'Am', value: 'Am' },
                    { label: 'A#m/Bbm', value: 'Bbm' },
                    { label: 'Bm', value: 'Bm' },
                    { label: 'Cm', value: 'Cm' },
                    { label: 'C#m/Dbm', value: 'C#m' },
                    { label: 'Dm', value: 'Dm' },
                    { label: 'D#m/Ebm', value: 'Ebm' },
                    { label: 'Em', value: 'Em' },
                    { label: 'Fm', value: 'Fm' },
                    { label: 'F#m/Gbm', value: 'F#m' },
                    { label: 'Gm', value: 'Gm' },
                    { label: 'G#m/Abm', value: 'G#m' },
                  ].map((keyOption) => (
                    <Pressable
                      key={keyOption.value}
                      style={[
                        styles.keyPickerItem,
                        key === keyOption.value && styles.keyPickerItemSelected,
                      ]}
                      onPress={() => {
                        setKey(keyOption.value);
                        setShowKeyPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.keyPickerItemText,
                        key === keyOption.value && styles.keyPickerItemTextSelected,
                      ]}>
                        {keyOption.label}
                      </Text>
                      {key === keyOption.value && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Sort Picker Modal */}
          <Modal
            visible={showSortPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowSortPicker(false)}
          >
            <View style={styles.keyPickerOverlay}>
              <View style={styles.keyPickerModal}>
                <View style={styles.keyPickerHeader}>
                  <Text style={styles.keyPickerTitle}>Sort By</Text>
                  <TouchableOpacity onPress={() => setShowSortPicker(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.keyPickerScroll}>
                  {[
                    { label: 'Popularity (Most Views)', value: 'popularity' as const },
                    { label: 'Title (A-Z)', value: 'title' as const },
                    { label: 'Artist (A-Z)', value: 'artist' as const },
                  ].map((sortOption) => (
                    <Pressable
                      key={sortOption.value}
                      style={[
                        styles.keyPickerItem,
                        sortBy === sortOption.value && styles.keyPickerItemSelected,
                      ]}
                      onPress={() => {
                        setSortBy(sortOption.value);
                        setShowSortPicker(false);
                        // Re-trigger search to apply new sort
                        if (searchResults.length > 0) {
                          handleSearch();
                        }
                      }}
                    >
                      <Text style={[
                        styles.keyPickerItemText,
                        sortBy === sortOption.value && styles.keyPickerItemTextSelected,
                      ]}>
                        {sortOption.label}
                      </Text>
                      {sortBy === sortOption.value && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Capo (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 1, 2, 3..."
            placeholderTextColor={theme.colors.textSecondary}
            value={capo}
            onChangeText={setCapo}
            keyboardType="number-pad"
          />

          <Text style={styles.sectionTitle}>Chord Sheet Content *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Paste your chord sheet here..."
            placeholderTextColor={theme.colors.textSecondary}
            value={body}
            onChangeText={(text) => {
              setBody(text);
              setShowPreview(false); // Reset preview when content changes
            }}
            multiline
            numberOfLines={15}
            textAlignVertical="top"
          />

          <Text style={styles.sectionTitle}>AI Formatting Options</Text>
          
          <View style={styles.optionRow}>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Chords Only</Text>
              <Text style={styles.optionDescription}>
                Extract and format only chords, remove lyrics
              </Text>
            </View>
            <Switch
              value={chordsOnly}
              onValueChange={setChordsOnly}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <Text style={styles.label}>Custom Instructions (Optional)</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="e.g., 'Add verse/chorus labels' or 'Show capo position'"
            placeholderTextColor={theme.colors.textSecondary}
            value={customInstructions}
            onChangeText={setCustomInstructions}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.previewButton, isPreviewing && styles.buttonDisabled]}
            onPress={handlePreview}
            disabled={isPreviewing}
          >
            {isPreviewing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Preview AI Formatting</Text>
            )}
          </TouchableOpacity>

          {showPreview && formattedPreview && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Formatted Preview</Text>
              <Text style={styles.previewHint}>
                You can edit the preview below before importing
              </Text>
              <TextInput
                style={styles.previewTextArea}
                value={formattedPreview}
                onChangeText={setFormattedPreview}
                multiline
                textAlignVertical="top"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          )}

          <Text style={styles.helpText}>
            {showPreview
              ? 'Preview looks good? Click "Import Sheet" below to save it.'
              : chordsOnly
              ? 'AI will extract and organize just the chords from your input.'
              : 'AI will format your chord sheet into a clean, easy-to-read layout with chords and lyrics.'}
          </Text>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleImport}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {showPreview ? 'Import Formatted Sheet' : 'Import Sheet'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      );
    }

    function renderSearch() {
      return (
        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs by title or artist..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setSelectedResult(null);
                setArtistFilter('');
              }}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, isSearching && styles.buttonDisabled]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.searchButtonText}>Search</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Search Results */}
          {rawSearchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                </Text>
                
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowFilterModal(true)}
                >
                  <Ionicons name="options-outline" size={18} color={theme.colors.primary} />
                  <Text style={styles.filterButtonText}>Filter & Sort</Text>
                </TouchableOpacity>
              </View>
              
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => `${item.songId}-${item.artistId}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultCard}
                    onPress={() => handleSelectSearchResult(item)}
                  >
                    <View style={styles.resultHeader}>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle}>{item.title}</Text>
                        <Text style={styles.resultArtist}>{item.artist}</Text>
                      </View>
                      <View style={styles.resultMeta}>
                        {item.views !== undefined && item.views > 0 && (
                          <View style={styles.viewsBadge}>
                            <Ionicons name="eye-outline" size={12} color={theme.colors.textSecondary} />
                            <Text style={styles.viewsText}>
                              {item.views >= 1000000 
                                ? `${(item.views / 1000000).toFixed(1)}M` 
                                : item.views >= 1000 
                                ? `${(item.views / 1000).toFixed(1)}K` 
                                : item.views}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.resultDetails}>
                      {item.instrumentInfo && (
                        <Text style={styles.resultInstrument}>
                          <Ionicons name="musical-note" size={12} color={theme.colors.textSecondary} />
                          {' '}{item.instrumentInfo}
                        </Text>
                      )}
                      {item.difficulty !== undefined && (
                        <View style={styles.difficultyBadge}>
                          <Ionicons name="star" size={12} color={theme.colors.primary} />
                          <Text style={styles.difficultyText}>
                            {item.difficulty}/10
                          </Text>
                        </View>
                      )}
                      {item.trackCount !== undefined && item.trackCount > 0 && (
                        <Text style={styles.resultTracks}>
                          {item.trackCount} {item.trackCount === 1 ? 'track' : 'tracks'}
                        </Text>
                      )}
                    </View>
                    
                    <Text style={styles.resultSource}>Source: Songsterr</Text>
                  </TouchableOpacity>
                )}  
                style={styles.resultsList}
              />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="filter-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyStateText}>No results match your filters</Text>
                  <Text style={styles.emptyStateHint}>Try adjusting your filters above</Text>
                </View>
              )}
            </View>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && rawSearchResults.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateText}>No results found</Text>
              <Text style={styles.emptyStateHint}>Try a different search term</Text>
            </View>
          )}

          {!searchQuery && !isSearching && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateText}>Search for Songs</Text>
              <Text style={styles.emptyStateHint}>
                Find chord sheets from online sources
              </Text>
            </View>
          )}

          {/* Filter Modal */}
          <Modal
            visible={showFilterModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowFilterModal(false)}
          >
            <View style={styles.keyPickerOverlay}>
              <View style={styles.filterModal}>
                <View style={styles.keyPickerHeader}>
                  <Text style={styles.keyPickerTitle}>Filter & Sort</Text>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.filterModalContent}>
                  {/* Sort By Section */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Sort By</Text>
                    {[
                      { label: 'Popularity (Most Views)', value: 'popularity' as const },
                      { label: 'Title (A-Z)', value: 'title' as const },
                      { label: 'Artist (A-Z)', value: 'artist' as const },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.filterOption,
                          sortBy === option.value && styles.filterOptionSelected,
                        ]}
                        onPress={() => setSortBy(option.value)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          sortBy === option.value && styles.filterOptionTextSelected,
                        ]}>
                          {option.label}
                        </Text>
                        {sortBy === option.value && (
                          <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Instrument Filter Section */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Instrument</Text>
                    {[
                      { label: 'All Instruments', value: 'all' },
                      { label: 'Guitar', value: 'guitar' },
                      { label: 'Bass', value: 'bass' },
                      { label: 'Drums', value: 'drums' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.filterOption,
                          instrumentFilter === option.value && styles.filterOptionSelected,
                        ]}
                        onPress={() => setInstrumentFilter(option.value)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          instrumentFilter === option.value && styles.filterOptionTextSelected,
                        ]}>
                          {option.label}
                        </Text>
                        {instrumentFilter === option.value && (
                          <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Artist Filter Section */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Artist</Text>
                    <View style={styles.artistSearchContainer}>
                      <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
                      <TextInput
                        style={styles.artistSearchInput}
                        placeholder="Filter by artist name..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={artistFilter}
                        onChangeText={setArtistFilter}
                      />
                      {artistFilter.length > 0 && (
                        <TouchableOpacity onPress={() => setArtistFilter('')}>
                          <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    {artistFilter.length > 0 && (
                      <Text style={styles.filterHint}>
                        Filtering results by "{artistFilter}"
                      </Text>
                    )}
                  </View>

                  {/* Apply Button */}
                  <TouchableOpacity
                    style={styles.applyFilterButton}
                    onPress={() => {
                      applyFiltersAndSort();
                      setShowFilterModal(false);
                    }}
                  >
                    <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      );
    }
  }

const createStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  filterModal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  filterModalContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    marginBottom: 8,
  },
  filterOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  filterOptionText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  filterOptionTextSelected: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  artistSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
  },
  artistSearchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    padding: 0,
  },
  filterHint: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  applyFilterButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  applyFilterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsList: {
    flex: 1,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  resultArtist: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
  },
  viewsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  chordsBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  keyBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  keyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  resultInstrument: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  resultTracks: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  resultPreview: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 8,
    lineHeight: 18,
  },
  resultSource: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
    color: theme.colors.text,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: theme.colors.text,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    height: 50,
  },
  pickerButtonText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  keyPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyPickerModal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  keyPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  keyPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  keyPickerScroll: {
    maxHeight: 400,
  },
  keyPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  keyPickerItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  keyPickerItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  keyPickerItemTextSelected: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 250,
    marginBottom: 16,
    color: theme.colors.text,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionText: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  helpText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 60,
    color: theme.colors.text,
  },
  previewButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  previewContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  previewHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  previewTextArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 200,
    maxHeight: 400,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  modalLoadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  previewInfo: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  previewArtist: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  previewMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  previewMetaText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  previewContentContainer: {
    flex: 1,
    padding: 16,
  },
  previewContentText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: theme.colors.text,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  modalCancelButtonFull: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  modalCancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalReviewButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  modalReviewButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalImportButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalImportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
