// ============================================
// RAPTOR (Hierarchical Retrieval) Module Exports
// ============================================

/**
 * Public API for lib/retrieval/hierarchical
 *
 * RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval):
 * Builds multi-level document hierarchies for improved context retrieval.
 *
 * Three-phase system:
 * 1. Clustering: Group similar documents using agglomerative hierarchical clustering
 * 2. Summarization: Generate abstractive summaries for each cluster (LLM or extractive)
 * 3. Traversal: Query-based tree traversal to find relevant nodes at multiple abstraction levels
 *
 * @example
 * ```typescript
 * import {
 *   HierarchyBuilder,
 *   HierarchyTraverser,
 *   type HierarchyTree,
 * } from "@/lib/retrieval/hierarchical";
 *
 * // 1. Build hierarchy from course materials
 * const builder = new HierarchyBuilder({
 *   courseName: "CS 101",
 *   courseCode: "cs-101",
 *   clustering: {
 *     algorithm: "agglomerative",
 *     similarityThreshold: 0.7,
 *   },
 *   summarization: {
 *     useLLM: false, // Extractive fallback
 *   },
 * });
 *
 * const tree = await builder.buildHierarchy(
 *   "CS 101",
 *   "cs-101",
 *   courseMaterials
 * );
 *
 * console.log(`Built tree with ${tree.leafCount} leaves, ${tree.internalCount} internal nodes`);
 * console.log(`Max depth: ${tree.maxDepth}, roots: ${tree.rootIds.length}`);
 *
 * // 2. Traverse hierarchy for query
 * const traverser = new HierarchyTraverser({
 *   strategy: "breadth-first",
 *   maxNodes: 10,
 *   minSimilarity: 0.5,
 * });
 *
 * const result = await traverser.traverse(tree, queryEmbedding);
 *
 * console.log(`Retrieved ${result.nodes.length} nodes`);
 * console.log(`Material IDs: ${result.materialIds.join(", ")}`);
 * console.log(`Avg similarity: ${result.metrics.avgSimilarity.toFixed(2)}`);
 * ```
 */

// Export types
export type {
  // Node types
  DocumentNode,
  DocumentCluster,

  // Tree structure
  HierarchyTree,

  // Configuration
  ClusteringConfig,
  SummarizerConfig,
  TraversalConfig,
  HierarchyConstructionOptions,

  // Results
  HierarchyRetrievalResult,

  // Metrics
  ConstructionMetrics,
  TraversalMetrics,
} from "./types";

// Export default configurations
export {
  DEFAULT_CLUSTERING_CONFIG,
  DEFAULT_SUMMARIZER_CONFIG,
  DEFAULT_TRAVERSAL_CONFIG,
  DEFAULT_HIERARCHY_OPTIONS,
} from "./types";

// Export classes
export { DocumentClusterer } from "./DocumentClusterer";
export { HierarchySummarizer } from "./HierarchySummarizer";
export { HierarchyTraverser } from "./HierarchyTraverser";
export { HierarchyBuilder } from "./HierarchyBuilder";

// Export summarization result type (from HierarchySummarizer)
export type { SummarizationResult } from "./HierarchySummarizer";
