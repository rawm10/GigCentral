# Import Screen Unit Tests

## Overview
This directory contains unit tests for the import screen logic in the StageReady mobile app. The tests focus on the core filtering, sorting, and data transformation functions that power the Songsterr integration feature.

## Test Coverage

### `import-search-logic.test.ts`
Tests the core business logic of the import screen without rendering components.

#### Test Suites:

**1. applyFiltersAndSort** (12 tests)
- Instrument filtering (guitar, bass, drums)
- "All instruments" smart filtering (excludes keyboards, vocals)
- Artist name filtering (case-insensitive, partial matching)
- Combined instrument + artist filtering
- Sorting by popularity (view count descending)
- Sorting alphabetically by title
- Sorting alphabetically by artist
- Edge cases (empty results, empty filters)

**2. handleReviewFromSearch - Metadata Extraction** (10 tests)
- Extracting key from ChordPro metadata
- Extracting capo value from ChordPro metadata
- Removing title/artist tags from body
- Removing key/capo tags from body
- Formatting tuning information
- Handling content without metadata
- Handling empty content
- Case-insensitive metadata parsing
- Handling extra whitespace in metadata

**3. Instrument Classification** (9 tests)
- Classifying various guitar types (electric, acoustic)
- Classifying bass instruments
- Classifying drums
- Filtering out unsupported instruments (piano, vocals)
- Case-insensitive classification
- Handling undefined/null values

## Running Tests

```bash
# Run all tests
npm test

# Run only import screen tests
npm test -- --testNamePattern="Import Screen"

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Test Data

The tests use mock search results that represent typical Songsterr API responses:
- The Beatles - "Hey Jude" (Electric Guitar, 5 difficulty, 1.5M views)
- Pink Floyd - "Wish You Were Here" (Acoustic Guitar, 7 difficulty, 2M views)
- Red Hot Chili Peppers - "Under the Bridge" (Bass Guitar, 6 difficulty, 1.2M views)
- Nirvana - "Smells Like Teen Spirit" (Drums, 8 difficulty, 3M views)
- The Beatles - "Let It Be" (Piano, 4 difficulty, 1.8M views) - Used to test filtering

## Key Business Logic Tested

### Smart Instrument Filtering
When "all instruments" is selected, the app only shows guitar, bass, and drums results - intentionally excluding keyboards, vocals, and other instruments that don't have typical chord notation.

### Metadata Extraction
The app extracts ChordPro metadata tags (`{key: C}`, `{capo: 2}`) from imported content, populates the manual entry form fields, and removes these tags from the chord sheet body to avoid duplication.

### Filter Persistence
Filters remain applied even when results are empty, allowing users to refine their search without losing their filter settings.

## Coverage Goals

Current coverage focuses on:
- ✅ Core filtering logic (instrument, artist)
- ✅ Sorting algorithms (popularity, title, artist)
- ✅ Metadata extraction and cleanup
- ✅ Instrument classification
- ✅ Edge cases and error handling

Future coverage should include:
- [ ] API integration tests (mocking fetch calls)
- [ ] Component rendering tests
- [ ] User interaction flows (search, filter, import)
- [ ] Theme integration
- [ ] Navigation behavior

## Notes

- Tests use pure functions extracted from the component for testability
- No React component rendering is tested here (pure logic only)
- All regex patterns match the actual implementation in `import.tsx`
- Test data represents real-world Songsterr API response structure
