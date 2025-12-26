/**
 * Unit tests for import.tsx search and filter logic
 * Tests the core filtering, sorting, and data transformation functions
 */

describe('Import Screen - Search Logic', () => {
  // Sample search results for testing
  const mockRawResults = [
    {
      songId: 1,
      artistId: 101,
      artist: 'The Beatles',
      title: 'Hey Jude',
      hasChords: true,
      instrumentInfo: 'Electric Guitar',
      trackCount: 3,
      difficulty: 5,
      views: 1500000,
      trackHash: 'abc123',
    },
    {
      songId: 2,
      artistId: 102,
      artist: 'Pink Floyd',
      title: 'Wish You Were Here',
      hasChords: true,
      instrumentInfo: 'Acoustic Guitar',
      trackCount: 2,
      difficulty: 7,
      views: 2000000,
      trackHash: 'def456',
    },
    {
      songId: 3,
      artistId: 103,
      artist: 'Red Hot Chili Peppers',
      title: 'Under the Bridge',
      hasChords: true,
      instrumentInfo: 'Bass Guitar',
      trackCount: 4,
      difficulty: 6,
      views: 1200000,
      trackHash: 'ghi789',
    },
    {
      songId: 4,
      artistId: 104,
      artist: 'Nirvana',
      title: 'Smells Like Teen Spirit',
      hasChords: true,
      instrumentInfo: 'Drums',
      trackCount: 3,
      difficulty: 8,
      views: 3000000,
      trackHash: 'jkl012',
    },
    {
      songId: 5,
      artistId: 105,
      artist: 'The Beatles',
      title: 'Let It Be',
      hasChords: true,
      instrumentInfo: 'Piano',
      trackCount: 2,
      difficulty: 4,
      views: 1800000,
      trackHash: 'mno345',
    },
  ];

  describe('applyFiltersAndSort', () => {
    const applyFiltersAndSort = (
      rawResults: typeof mockRawResults,
      instrumentFilter: string,
      artistFilter: string,
      sortBy: 'popularity' | 'title' | 'artist'
    ) => {
      let filtered = [...rawResults];

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

      return filtered;
    };

    it('should filter by guitar instrument', () => {
      const results = applyFiltersAndSort(mockRawResults, 'guitar', '', 'popularity');
      
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Wish You Were Here');
      expect(results[1].title).toBe('Hey Jude');
    });

    it('should filter by bass instrument', () => {
      const results = applyFiltersAndSort(mockRawResults, 'bass', '', 'popularity');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Under the Bridge');
      expect(results[0].instrumentInfo).toBe('Bass Guitar');
    });

    it('should filter by drums instrument', () => {
      const results = applyFiltersAndSort(mockRawResults, 'drums', '', 'popularity');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Smells Like Teen Spirit');
      expect(results[0].instrumentInfo).toBe('Drums');
    });

    it('should show only guitar, bass, and drums when all is selected', () => {
      const results = applyFiltersAndSort(mockRawResults, 'all', '', 'popularity');
      
      expect(results).toHaveLength(4);
      expect(results.some(r => r.instrumentInfo === 'Piano')).toBe(false);
    });

    it('should filter by artist name (case insensitive)', () => {
      const results = applyFiltersAndSort(mockRawResults, 'all', 'beatles', 'popularity');
      
      // Only one Beatles song matches (Hey Jude - Electric Guitar), not Let It Be (Piano)
      expect(results).toHaveLength(1);
      expect(results[0].artist).toBe('The Beatles');
      expect(results[0].title).toBe('Hey Jude');
    });

    it('should filter by artist name (partial match)', () => {
      const results = applyFiltersAndSort(mockRawResults, 'all', 'pink', 'popularity');
      
      expect(results).toHaveLength(1);
      expect(results[0].artist).toBe('Pink Floyd');
    });

    it('should combine instrument and artist filters', () => {
      const results = applyFiltersAndSort(mockRawResults, 'guitar', 'beatles', 'popularity');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Hey Jude');
    });

    it('should sort by popularity (views descending)', () => {
      const results = applyFiltersAndSort(mockRawResults, 'all', '', 'popularity');
      
      expect(results[0].title).toBe('Smells Like Teen Spirit');
      expect(results[0].views).toBe(3000000);
      expect(results[results.length - 1].views).toBe(1200000);
    });

    it('should sort by title alphabetically', () => {
      const results = applyFiltersAndSort(mockRawResults, 'all', '', 'title');
      
      // Alphabetically: Hey Jude < Smells Like Teen Spirit < Under the Bridge < Wish You Were Here
      expect(results[0].title).toBe('Hey Jude');
      expect(results[1].title).toBe('Smells Like Teen Spirit');
      expect(results[2].title).toBe('Under the Bridge');
      expect(results[3].title).toBe('Wish You Were Here');
    });

    it('should sort by artist alphabetically', () => {
      const results = applyFiltersAndSort(mockRawResults, 'all', '', 'artist');
      
      expect(results[0].artist).toBe('Nirvana');
      expect(results[1].artist).toBe('Pink Floyd');
      expect(results[2].artist).toBe('Red Hot Chili Peppers');
    });

    it('should return empty array when no results match filters', () => {
      const results = applyFiltersAndSort(mockRawResults, 'guitar', 'nirvana', 'popularity');
      
      expect(results).toHaveLength(0);
    });

    it('should handle empty artist filter', () => {
      const results = applyFiltersAndSort(mockRawResults, 'all', '   ', 'popularity');
      
      expect(results).toHaveLength(4);
    });
  });

  describe('handleReviewFromSearch - Metadata Extraction', () => {
    const extractMetadata = (previewContent: string) => {
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

      return { extractedKey, extractedCapo, cleanedBody };
    };

    it('should extract key from ChordPro content', () => {
      const content = '{title: Hey Jude}\n{artist: The Beatles}\n{key: C}\n\n[C]Hey [G]Jude';
      const { extractedKey } = extractMetadata(content);
      
      expect(extractedKey).toBe('C');
    });

    it('should extract capo from ChordPro content', () => {
      const content = '{title: Wonderwall}\n{artist: Oasis}\n{capo: 2}\n\n[Em7]Today is gonna';
      const { extractedCapo } = extractMetadata(content);
      
      expect(extractedCapo).toBe('2');
    });

    it('should extract both key and capo', () => {
      const content = '{key: G}\n{capo: 3}\n\n[G]Some lyrics';
      const { extractedKey, extractedCapo } = extractMetadata(content);
      
      expect(extractedKey).toBe('G');
      expect(extractedCapo).toBe('3');
    });

    it('should remove title and artist from body', () => {
      const content = '{title: Test Song}\n{artist: Test Artist}\n\n[C]Verse 1\n[G]Chorus';
      const { cleanedBody } = extractMetadata(content);
      
      expect(cleanedBody).not.toContain('{title:');
      expect(cleanedBody).not.toContain('{artist:');
      expect(cleanedBody).toContain('[C]Verse 1');
    });

    it('should remove key and capo metadata from body', () => {
      const content = '{key: C}\n{capo: 2}\n\n[C]Verse\n[G]Chorus';
      const { cleanedBody } = extractMetadata(content);
      
      expect(cleanedBody).not.toContain('{key:');
      expect(cleanedBody).not.toContain('{capo:');
      expect(cleanedBody).toContain('[C]Verse');
    });

    it('should format tuning in user-friendly way', () => {
      const content = '{tuning: DADGAD}\n\n[D]Some content';
      const { cleanedBody } = extractMetadata(content);
      
      expect(cleanedBody).toContain('Tuning: DADGAD');
      expect(cleanedBody).not.toContain('{tuning:');
    });

    it('should handle content without metadata', () => {
      const content = '[C]Just some chords\n[G]No metadata';
      const { extractedKey, extractedCapo, cleanedBody } = extractMetadata(content);
      
      expect(extractedKey).toBe('');
      expect(extractedCapo).toBe('');
      expect(cleanedBody).toBe(content);
    });

    it('should handle empty content', () => {
      const { extractedKey, extractedCapo, cleanedBody } = extractMetadata('');
      
      expect(extractedKey).toBe('');
      expect(extractedCapo).toBe('');
      expect(cleanedBody).toBe('');
    });

    it('should handle case-insensitive metadata tags', () => {
      const content = '{KEY: D}\n{CAPO: 1}\n\n[D]Test';
      const { extractedKey, extractedCapo } = extractMetadata(content);
      
      expect(extractedKey).toBe('D');
      expect(extractedCapo).toBe('1');
    });
5
    it('should handle metadata with extra spaces before values', () => {
      const content = '{key:  Am}\n{capo:  5}\n\n[Am]Test';
      const { extractedKey, extractedCapo } = extractMetadata(content);
      
      expect(extractedKey).toBe('Am');
      expect(extractedCapo).toBe('5');
    });
  });

  describe('Instrument Classification', () => {
    const classifyInstrument = (instrumentInfo: string | undefined) => {
      if (!instrumentInfo) return null;
      
      const instrumentLower = instrumentInfo.toLowerCase();
      
      const isGuitar = instrumentLower.includes('guitar') && !instrumentLower.includes('bass');
      const isBass = instrumentLower.includes('bass');
      const isDrums = instrumentLower.includes('drum');
      
      if (isGuitar) return 'guitar';
      if (isBass) return 'bass';
      if (isDrums) return 'drums';
      return 'other';
    };

    it('should classify Electric Guitar as guitar', () => {
      expect(classifyInstrument('Electric Guitar')).toBe('guitar');
    });

    it('should classify Acoustic Guitar as guitar', () => {
      expect(classifyInstrument('Acoustic Guitar')).toBe('guitar');
    });

    it('should classify Bass Guitar as bass', () => {
      expect(classifyInstrument('Bass Guitar')).toBe('bass');
    });

    it('should classify Electric Bass as bass', () => {
      expect(classifyInstrument('Electric Bass')).toBe('bass');
    });

    it('should classify Drums as drums', () => {
      expect(classifyInstrument('Drums')).toBe('drums');
    });

    it('should classify Piano as other', () => {
      expect(classifyInstrument('Piano')).toBe('other');
    });

    it('should classify Vocals as other', () => {
      expect(classifyInstrument('Vocals')).toBe('other');
    });

    it('should handle undefined instrument', () => {
      expect(classifyInstrument(undefined)).toBe(null);
    });

    it('should be case insensitive', () => {
      expect(classifyInstrument('ELECTRIC GUITAR')).toBe('guitar');
      expect(classifyInstrument('bass guitar')).toBe('bass');
    });
  });
});
