// ============================================
// RAPTOR (Hierarchical Retrieval) Types
// ============================================

import type { CourseMaterial } from "@/lib/models/types";

/**
 * Document node in the hierarchy tree
 *
 * Represents either a leaf node (original material) or an internal node (summary).
 */
export interface DocumentNode {
  /** Unique node identifier */
  id: string;

  /** Node type */
  type: "leaf" | "internal";

  /** Level in hierarchy (0 = root, higher = deeper) */
  level: number;

  /** Text content (original or summary) */
  content: string;

  /** Embedding vector for similarity search */
  embedding: number[];

  /** Material IDs contained in this subtree (leaf: [self], internal: all descendants) */
  materialIds: string[];

  /** Parent node ID (null for root nodes) */
  parentId: string | null;

  /** Child node IDs (empty for leaf nodes) */
  childIds: string[];

  /** Metadata from original materials */
  metadata: {
    /** Cluster size (number of descendants) */
    clusterSize: number;

    /** Average similarity within cluster (0-1) */
    avgSimilarity: number;

    /** Most common keywords */
    topKeywords: string[];

    /** Week range covered */
    weekRange?: [number, number];
  };
}

/**
 * Document cluster during hierarchy construction
 */
export interface DocumentCluster {
  /** Cluster identifier */
  id: string;

  /** Document nodes in this cluster */
  nodes: DocumentNode[];

  /** Centroid embedding (average of all node embeddings) */
  centroid: number[];

  /** Cluster cohesion score (0-1, higher = more cohesive) */
  cohesion: number;
}

/**
 * Complete hierarchy tree
 */
export interface HierarchyTree {
  /** Tree identifier (typically course ID) */
  id: string;

  /** Course information */
  courseName: string;
  courseCode: string;

  /** All nodes in the tree (indexed by ID) */
  nodes: Map<string, DocumentNode>;

  /** Root node IDs (typically one per major topic) */
  rootIds: string[];

  /** Maximum depth of the tree */
  maxDepth: number;

  /** Total number of leaf nodes (original materials) */
  leafCount: number;

  /** Total number of internal nodes (summaries) */
  internalCount: number;

  /** Construction timestamp */
  builtAt: string;

  /** Construction metrics */
  metrics: ConstructionMetrics;
}

/**
 * Clustering configuration
 */
export interface ClusteringConfig {
  /** Clustering algorithm */
  algorithm: "agglomerative" | "kmeans";

  /** Similarity threshold for merging clusters (0-1) */
  similarityThreshold: number;

  /** Minimum cluster size before creating summary */
  minClusterSize: number;

  /** Maximum cluster size before splitting */
  maxClusterSize: number;

  /** Linkage method for agglomerative clustering */
  linkage: "average" | "complete" | "single";
}

/**
 * Summarizer configuration
 */
export interface SummarizerConfig {
  /** Use LLM for summarization (true) or extractive fallback (false) */
  useLLM: boolean;

  /** LLM provider (if useLLM = true) */
  llmProvider?: "openai" | "anthropic";

  /** Summary length target (words) */
  targetLength: number;

  /** Maximum input length for summarization (tokens) */
  maxInputTokens: number;

  /** Include keywords in summary */
  includeKeywords: boolean;
}

/**
 * Traversal configuration
 */
export interface TraversalConfig {
  /** Traversal strategy */
  strategy: "breadth-first" | "depth-first" | "adaptive";

  /** Maximum depth to traverse (-1 = unlimited) */
  maxDepth: number;

  /** Maximum nodes to return */
  maxNodes: number;

  /** Minimum similarity for node selection (0-1) */
  minSimilarity: number;

  /** Whether to include parent contexts */
  includeParents: boolean;
}

/**
 * Hierarchy construction options
 */
export interface HierarchyConstructionOptions {
  /** Course information */
  courseName: string;
  courseCode: string;

  /** Clustering configuration */
  clustering?: Partial<ClusteringConfig>;

  /** Summarizer configuration */
  summarization?: Partial<SummarizerConfig>;

  /** Maximum levels in hierarchy */
  maxLevels?: number;

  /** Stop clustering if level has fewer than this many nodes */
  minNodesPerLevel?: number;
}

/**
 * Hierarchy retrieval result
 */
export interface HierarchyRetrievalResult {
  /** Retrieved nodes (sorted by relevance) */
  nodes: DocumentNode[];

  /** Leaf material IDs from retrieved nodes */
  materialIds: string[];

  /** Traversal path taken */
  traversalPath: string[];

  /** Query-to-node similarities */
  similarities: Map<string, number>;

  /** Traversal metrics */
  metrics: TraversalMetrics;
}

/**
 * Construction metrics
 */
export interface ConstructionMetrics {
  /** Total construction time (ms) */
  totalTime: number;

  /** Clustering time (ms) */
  clusteringTime: number;

  /** Summarization time (ms) */
  summarizationTime: number;

  /** Number of clustering iterations */
  iterations: number;

  /** Number of summaries generated */
  summariesGenerated: number;

  /** Average cluster size */
  avgClusterSize: number;

  /** Average cohesion score */
  avgCohesion: number;
}

/**
 * Traversal metrics
 */
export interface TraversalMetrics {
  /** Traversal time (ms) */
  traversalTime: number;

  /** Nodes visited */
  nodesVisited: number;

  /** Nodes returned */
  nodesReturned: number;

  /** Deepest level reached */
  maxDepthReached: number;

  /** Average similarity to query */
  avgSimilarity: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CLUSTERING_CONFIG: ClusteringConfig = {
  algorithm: "agglomerative",
  similarityThreshold: 0.7,
  minClusterSize: 2,
  maxClusterSize: 10,
  linkage: "average",
};

export const DEFAULT_SUMMARIZER_CONFIG: SummarizerConfig = {
  useLLM: false, // Extractive fallback by default (no LLM required)
  targetLength: 300,
  maxInputTokens: 4000,
  includeKeywords: true,
};

export const DEFAULT_TRAVERSAL_CONFIG: TraversalConfig = {
  strategy: "breadth-first",
  maxDepth: -1,
  maxNodes: 10,
  minSimilarity: 0.5,
  includeParents: false,
};

export const DEFAULT_HIERARCHY_OPTIONS: Required<
  Omit<HierarchyConstructionOptions, "courseName" | "courseCode">
> = {
  clustering: DEFAULT_CLUSTERING_CONFIG,
  summarization: DEFAULT_SUMMARIZER_CONFIG,
  maxLevels: 3,
  minNodesPerLevel: 2,
};
