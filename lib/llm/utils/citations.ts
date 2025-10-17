// ============================================
// Citation Parser Utility (Phase 2.4)
// ============================================
//
// Extracts citations from LLM responses for display in UI.
// Parses inline citation markers [1], [2] and Sources section.

export interface Citation {
  id: number;
  title: string;
  type: string;
  materialId?: string;
}

export interface ParsedCitations {
  /** Array of citations extracted from Sources section */
  citations: Citation[];
  /** Set of citation IDs found in the text (e.g., [1], [2]) */
  citationMarkers: Set<number>;
  /** Text content without the Sources section */
  contentWithoutSources: string;
  /** Raw Sources section text */
  sourcesSection: string | null;
}

/**
 * Parse citations from LLM response text
 *
 * Expected format:
 * ```
 * Binary search is an O(log n) algorithm [1]. It works by dividing the search space [2].
 *
 * **Sources:**
 * 1. Lecture 3: Binary Search (Type: lecture)
 * 2. Week 2 Slides: Search Algorithms (Type: slide)
 * ```
 *
 * @param responseText - Full LLM response text
 * @returns Parsed citations with metadata
 */
export function parseCitations(responseText: string): ParsedCitations {
  // Extract inline citation markers [1], [2], etc.
  const citationMarkers = new Set<number>();
  const inlinePattern = /\[(\d+)\]/g;
  let match;

  while ((match = inlinePattern.exec(responseText)) !== null) {
    const citationNum = parseInt(match[1], 10);
    citationMarkers.add(citationNum);
  }

  // Find Sources section
  const sourcesMatch = responseText.match(/\*\*Sources:\*\*\s*([\s\S]*?)(?:\n\n|$)/);

  if (!sourcesMatch) {
    // No Sources section found
    return {
      citations: [],
      citationMarkers,
      contentWithoutSources: responseText,
      sourcesSection: null,
    };
  }

  const sourcesSection = sourcesMatch[0];
  const sourcesContent = sourcesMatch[1];
  const contentWithoutSources = responseText.replace(sourcesMatch[0], '').trim();

  // Parse individual source entries
  // Format: "1. Title (Type: lecture)"
  const sourcePattern = /^(\d+)\.\s*(.+?)\s*\(Type:\s*(.+?)\)\s*$/gm;
  const citations: Citation[] = [];

  while ((match = sourcePattern.exec(sourcesContent)) !== null) {
    const id = parseInt(match[1], 10);
    const title = match[2].trim();
    const type = match[3].trim();

    citations.push({
      id,
      title,
      type,
    });
  }

  return {
    citations,
    citationMarkers,
    contentWithoutSources,
    sourcesSection,
  };
}

/**
 * Check if response text contains citations
 *
 * @param responseText - LLM response text
 * @returns True if response has citations
 */
export function hasCitations(responseText: string): boolean {
  return /\*\*Sources:\*\*/.test(responseText);
}

/**
 * Extract material ID from citation title
 *
 * Attempts to extract material ID if the title contains it.
 * Example: "[CS 101] Lecture 3: Binary Search" → "mat-cs101-lecture-3"
 *
 * @param citationTitle - Title from Sources section
 * @returns Material ID if extractable, undefined otherwise
 */
export function extractMaterialId(citationTitle: string): string | undefined {
  // Try to match course code in brackets
  const courseMatch = citationTitle.match(/\[([A-Z]+\s*\d+)\]/);
  if (!courseMatch) {
    return undefined;
  }

  const courseCode = courseMatch[1].replace(/\s+/g, '').toLowerCase(); // "CS 101" → "cs101"

  // Try to match material type and number
  const typeMatch = citationTitle.match(/(Lecture|Slide|Assignment|Reading|Lab)\s*(\d+)/i);
  if (!typeMatch) {
    return undefined;
  }

  const materialType = typeMatch[1].toLowerCase();
  const materialNum = typeMatch[2];

  return `mat-${courseCode}-${materialType}-${materialNum}`;
}

/**
 * Format citations for display
 *
 * Converts parsed citations into user-friendly display format.
 *
 * @param citations - Parsed citations
 * @returns Formatted citation strings
 */
export function formatCitations(citations: Citation[]): string[] {
  return citations.map(c => {
    const typeLabel = formatCitationType(c.type);
    return `${c.id}. ${c.title} (${typeLabel})`;
  });
}

/**
 * Format citation type for display
 *
 * @param type - Citation type (lecture, slide, etc.)
 * @returns User-friendly type label
 */
function formatCitationType(type: string): string {
  const typeMap: Record<string, string> = {
    'lecture': 'Lecture Notes',
    'slide': 'Slides',
    'assignment': 'Assignment',
    'reading': 'Reading',
    'lab': 'Lab',
    'exam': 'Exam',
    'quiz': 'Quiz',
    'other': 'Other',
  };

  return typeMap[type.toLowerCase()] || type;
}

/**
 * Highlight citations in text
 *
 * Wraps inline citations [1], [2] with HTML for styling.
 * Useful for rendering citations as clickable links.
 *
 * @param text - Text containing inline citations
 * @param citations - Parsed citations for validation
 * @returns Text with citations wrapped in <mark> tags
 */
export function highlightCitations(text: string, citations: Citation[]): string {
  const validIds = new Set(citations.map(c => c.id));

  return text.replace(/\[(\d+)\]/g, (match, idStr) => {
    const id = parseInt(idStr, 10);
    if (validIds.has(id)) {
      return `<mark data-citation-id="${id}" class="citation-marker">${match}</mark>`;
    }
    return match;
  });
}

/**
 * Validate citations
 *
 * Checks that all inline citation markers have corresponding entries
 * in the Sources section.
 *
 * @param parsed - Parsed citations
 * @returns Validation result with missing/extra citations
 */
export function validateCitations(parsed: ParsedCitations): {
  valid: boolean;
  missingInSources: number[];
  extraInSources: number[];
} {
  const markerIds = Array.from(parsed.citationMarkers);
  const sourceIds = parsed.citations.map(c => c.id);

  const missingInSources = markerIds.filter(id => !sourceIds.includes(id));
  const extraInSources = sourceIds.filter(id => !markerIds.includes(id));

  return {
    valid: missingInSources.length === 0 && extraInSources.length === 0,
    missingInSources,
    extraInSources,
  };
}
