// ============================================
// DocumentClusterer: Agglomerative Hierarchical Clustering
// ============================================

import type {
  DocumentNode,
  DocumentCluster,
  ClusteringConfig,
} from "./types";
import { DEFAULT_CLUSTERING_CONFIG } from "./types";

/**
 * DocumentClusterer: Clusters documents using agglomerative hierarchical clustering
 *
 * Algorithm:
 * 1. Start with each document as its own cluster
 * 2. Compute pairwise similarities between all clusters
 * 3. Merge the two most similar clusters (based on linkage method)
 * 4. Recompute similarities involving the merged cluster
 * 5. Repeat until stopping criteria met:
 *    - Similarity falls below threshold
 *    - Cluster size exceeds maxClusterSize
 *    - Only one cluster remains
 *
 * Linkage methods:
 * - Average: Average similarity between all pairs
 * - Complete: Minimum similarity between all pairs (farthest neighbors)
 * - Single: Maximum similarity between all pairs (nearest neighbors)
 */
export class DocumentClusterer {
  private config: ClusteringConfig;

  constructor(config: Partial<ClusteringConfig> = {}) {
    this.config = { ...DEFAULT_CLUSTERING_CONFIG, ...config };
  }

  /**
   * Cluster documents into groups based on embedding similarity
   */
  public clusterDocuments(nodes: DocumentNode[]): DocumentCluster[] {
    if (nodes.length === 0) {
      return [];
    }

    // Start with each node as its own cluster
    let clusters: DocumentCluster[] = nodes.map((node) =>
      this.createSingletonCluster(node)
    );

    // Agglomerative clustering loop
    while (clusters.length > 1) {
      // Find most similar pair
      const { cluster1Idx, cluster2Idx, similarity } =
        this.findMostSimilarPair(clusters);

      // Check stopping criteria
      if (similarity < this.config.similarityThreshold) {
        break; // Similarity too low, stop merging
      }

      // Check if merge would exceed maxClusterSize
      const mergedSize =
        clusters[cluster1Idx].nodes.length +
        clusters[cluster2Idx].nodes.length;
      if (mergedSize > this.config.maxClusterSize) {
        break; // Would exceed max size, stop merging
      }

      // Merge the two clusters
      const mergedCluster = this.mergeClusters(
        clusters[cluster1Idx],
        clusters[cluster2Idx]
      );

      // Remove old clusters and add merged cluster
      clusters = [
        ...clusters.slice(0, cluster1Idx),
        ...clusters.slice(cluster1Idx + 1, cluster2Idx),
        ...clusters.slice(cluster2Idx + 1),
        mergedCluster,
      ];
    }

    // Filter out clusters below minimum size
    return clusters.filter(
      (cluster) => cluster.nodes.length >= this.config.minClusterSize
    );
  }

  // ============================================
  // Private Methods: Cluster Operations
  // ============================================

  private createSingletonCluster(node: DocumentNode): DocumentCluster {
    return {
      id: `cluster-${node.id}`,
      nodes: [node],
      centroid: node.embedding,
      cohesion: 1.0, // Perfect cohesion for singleton
    };
  }

  private mergeClusters(
    cluster1: DocumentCluster,
    cluster2: DocumentCluster
  ): DocumentCluster {
    const mergedNodes = [...cluster1.nodes, ...cluster2.nodes];
    const mergedCentroid = this.computeCentroid(
      mergedNodes.map((n) => n.embedding)
    );
    const mergedCohesion = this.computeCohesion(mergedNodes);

    return {
      id: `cluster-${cluster1.id}-${cluster2.id}`,
      nodes: mergedNodes,
      centroid: mergedCentroid,
      cohesion: mergedCohesion,
    };
  }

  // ============================================
  // Private Methods: Similarity & Distance
  // ============================================

  private findMostSimilarPair(clusters: DocumentCluster[]): {
    cluster1Idx: number;
    cluster2Idx: number;
    similarity: number;
  } {
    let maxSimilarity = -Infinity;
    let bestPair = { cluster1Idx: 0, cluster2Idx: 1, similarity: 0 };

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const similarity = this.computeClusterSimilarity(
          clusters[i],
          clusters[j]
        );

        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestPair = { cluster1Idx: i, cluster2Idx: j, similarity };
        }
      }
    }

    return bestPair;
  }

  private computeClusterSimilarity(
    cluster1: DocumentCluster,
    cluster2: DocumentCluster
  ): number {
    const { linkage } = this.config;

    // Compute pairwise similarities between all node pairs
    const similarities: number[] = [];
    for (const node1 of cluster1.nodes) {
      for (const node2 of cluster2.nodes) {
        const sim = this.cosineSimilarity(node1.embedding, node2.embedding);
        similarities.push(sim);
      }
    }

    if (similarities.length === 0) {
      return 0;
    }

    // Apply linkage method
    switch (linkage) {
      case "average":
        return similarities.reduce((sum, s) => sum + s, 0) / similarities.length;

      case "complete":
        return Math.min(...similarities); // Farthest neighbors (min similarity)

      case "single":
        return Math.max(...similarities); // Nearest neighbors (max similarity)

      default:
        throw new Error(`Unknown linkage method: ${linkage}`);
    }
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error(
        `Vector dimension mismatch: ${vec1.length} !== ${vec2.length}`
      );
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude1 = Math.sqrt(norm1);
    const magnitude2 = Math.sqrt(norm2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  // ============================================
  // Private Methods: Centroid & Cohesion
  // ============================================

  private computeCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      return [];
    }

    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i];
      }
    }

    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= embeddings.length;
    }

    return centroid;
  }

  private computeCohesion(nodes: DocumentNode[]): number {
    if (nodes.length <= 1) {
      return 1.0;
    }

    // Compute average pairwise similarity
    let totalSimilarity = 0;
    let pairCount = 0;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const similarity = this.cosineSimilarity(
          nodes[i].embedding,
          nodes[j].embedding
        );
        totalSimilarity += similarity;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalSimilarity / pairCount : 0;
  }

  // ============================================
  // Public Utility Methods
  // ============================================

  /**
   * Get current configuration
   */
  public getConfig(): ClusteringConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ClusteringConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
