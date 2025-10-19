// ============================================
// HierarchyTraverser: Query-Based Tree Traversal
// ============================================

import type {
  HierarchyTree,
  DocumentNode,
  TraversalConfig,
  HierarchyRetrievalResult,
  TraversalMetrics,
} from "./types";
import { DEFAULT_TRAVERSAL_CONFIG } from "./types";

/**
 * HierarchyTraverser: Traverses hierarchy tree to find relevant nodes
 *
 * Three traversal strategies:
 * 1. Breadth-First: Explore all nodes at each level before going deeper
 * 2. Depth-First: Explore deepest paths first
 * 3. Adaptive: Start breadth-first, switch to depth-first for high-similarity branches
 *
 * Algorithm:
 * - Start from root nodes
 * - Compute similarity between query embedding and node embeddings
 * - Prune branches below similarity threshold
 * - Collect top-K most relevant nodes
 * - Return leaf material IDs and traversal path
 */
export class HierarchyTraverser {
  private config: TraversalConfig;

  constructor(config: Partial<TraversalConfig> = {}) {
    this.config = { ...DEFAULT_TRAVERSAL_CONFIG, ...config };
  }

  /**
   * Traverse hierarchy tree to find relevant nodes for query
   */
  public async traverse(
    tree: HierarchyTree,
    queryEmbedding: number[]
  ): Promise<HierarchyRetrievalResult> {
    const startTime = Date.now();

    // Choose traversal strategy
    let nodes: DocumentNode[];
    let traversalPath: string[];

    switch (this.config.strategy) {
      case "breadth-first":
        ({ nodes, traversalPath } = this.traverseBreadthFirst(
          tree,
          queryEmbedding
        ));
        break;

      case "depth-first":
        ({ nodes, traversalPath } = this.traverseDepthFirst(
          tree,
          queryEmbedding
        ));
        break;

      case "adaptive":
        ({ nodes, traversalPath } = this.traverseAdaptive(tree, queryEmbedding));
        break;

      default:
        throw new Error(`Unknown traversal strategy: ${this.config.strategy}`);
    }

    // Compute similarities for all retrieved nodes
    const similarities = new Map<string, number>();
    nodes.forEach((node) => {
      const similarity = this.cosineSimilarity(queryEmbedding, node.embedding);
      similarities.set(node.id, similarity);
    });

    // Sort nodes by similarity (descending)
    nodes.sort((a, b) => {
      const simA = similarities.get(a.id) || 0;
      const simB = similarities.get(b.id) || 0;
      return simB - simA;
    });

    // Limit to maxNodes
    nodes = nodes.slice(0, this.config.maxNodes);

    // Extract material IDs from leaf nodes
    const materialIds = this.extractMaterialIds(nodes);

    // Compute metrics
    const traversalTime = Date.now() - startTime;
    const metrics = this.computeMetrics(
      nodes,
      similarities,
      traversalPath,
      traversalTime
    );

    return {
      nodes,
      materialIds,
      traversalPath,
      similarities,
      metrics,
    };
  }

  // ============================================
  // Private Methods: Breadth-First Traversal
  // ============================================

  private traverseBreadthFirst(
    tree: HierarchyTree,
    queryEmbedding: number[]
  ): { nodes: DocumentNode[]; traversalPath: string[] } {
    const queue: string[] = [...tree.rootIds];
    const visited = new Set<string>();
    const traversalPath: string[] = [];
    const candidateNodes: Array<{ node: DocumentNode; similarity: number }> = [];

    while (queue.length > 0 && candidateNodes.length < this.config.maxNodes * 2) {
      const nodeId = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = tree.nodes.get(nodeId);
      if (!node) continue;

      traversalPath.push(nodeId);

      // Compute similarity
      const similarity = this.cosineSimilarity(queryEmbedding, node.embedding);

      // Check depth limit
      if (
        this.config.maxDepth >= 0 &&
        node.level > this.config.maxDepth
      ) {
        continue;
      }

      // Check similarity threshold
      if (similarity >= this.config.minSimilarity) {
        candidateNodes.push({ node, similarity });

        // Add children to queue
        queue.push(...node.childIds);
      }
    }

    // Sort by similarity and return top nodes
    candidateNodes.sort((a, b) => b.similarity - a.similarity);
    const nodes = candidateNodes
      .slice(0, this.config.maxNodes)
      .map((c) => c.node);

    return { nodes, traversalPath };
  }

  // ============================================
  // Private Methods: Depth-First Traversal
  // ============================================

  private traverseDepthFirst(
    tree: HierarchyTree,
    queryEmbedding: number[]
  ): { nodes: DocumentNode[]; traversalPath: string[] } {
    const visited = new Set<string>();
    const traversalPath: string[] = [];
    const candidateNodes: Array<{ node: DocumentNode; similarity: number }> = [];

    // Recursive DFS helper
    const dfs = (nodeId: string, currentDepth: number) => {
      if (visited.has(nodeId)) return;
      if (
        this.config.maxDepth >= 0 &&
        currentDepth > this.config.maxDepth
      ) {
        return;
      }
      if (candidateNodes.length >= this.config.maxNodes * 2) return;

      visited.add(nodeId);
      const node = tree.nodes.get(nodeId);
      if (!node) return;

      traversalPath.push(nodeId);

      // Compute similarity
      const similarity = this.cosineSimilarity(queryEmbedding, node.embedding);

      // Check similarity threshold
      if (similarity >= this.config.minSimilarity) {
        candidateNodes.push({ node, similarity });

        // Recursively visit children
        for (const childId of node.childIds) {
          dfs(childId, currentDepth + 1);
        }
      }
    };

    // Start DFS from all root nodes
    for (const rootId of tree.rootIds) {
      dfs(rootId, 0);
    }

    // Sort by similarity and return top nodes
    candidateNodes.sort((a, b) => b.similarity - a.similarity);
    const nodes = candidateNodes
      .slice(0, this.config.maxNodes)
      .map((c) => c.node);

    return { nodes, traversalPath };
  }

  // ============================================
  // Private Methods: Adaptive Traversal
  // ============================================

  private traverseAdaptive(
    tree: HierarchyTree,
    queryEmbedding: number[]
  ): { nodes: DocumentNode[]; traversalPath: string[] } {
    const visited = new Set<string>();
    const traversalPath: string[] = [];
    const candidateNodes: Array<{ node: DocumentNode; similarity: number }> = [];

    // Start with breadth-first from roots
    const queue: Array<{ nodeId: string; depth: number }> = tree.rootIds.map(
      (id) => ({ nodeId: id, depth: 0 })
    );

    while (queue.length > 0 && candidateNodes.length < this.config.maxNodes * 2) {
      const { nodeId, depth } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = tree.nodes.get(nodeId);
      if (!node) continue;

      traversalPath.push(nodeId);

      // Compute similarity
      const similarity = this.cosineSimilarity(queryEmbedding, node.embedding);

      // Check depth limit
      if (this.config.maxDepth >= 0 && depth > this.config.maxDepth) {
        continue;
      }

      // Check similarity threshold
      if (similarity >= this.config.minSimilarity) {
        candidateNodes.push({ node, similarity });

        // Adaptive strategy: If high similarity (>0.8), switch to depth-first for this branch
        if (similarity > 0.8) {
          // Depth-first exploration of this high-similarity branch
          this.exploreBranchDepthFirst(
            node,
            tree,
            queryEmbedding,
            visited,
            candidateNodes,
            traversalPath,
            depth + 1
          );
        } else {
          // Continue breadth-first
          node.childIds.forEach((childId) => {
            queue.push({ nodeId: childId, depth: depth + 1 });
          });
        }
      }
    }

    // Sort by similarity and return top nodes
    candidateNodes.sort((a, b) => b.similarity - a.similarity);
    const nodes = candidateNodes
      .slice(0, this.config.maxNodes)
      .map((c) => c.node);

    return { nodes, traversalPath };
  }

  private exploreBranchDepthFirst(
    rootNode: DocumentNode,
    tree: HierarchyTree,
    queryEmbedding: number[],
    visited: Set<string>,
    candidateNodes: Array<{ node: DocumentNode; similarity: number }>,
    traversalPath: string[],
    currentDepth: number
  ): void {
    for (const childId of rootNode.childIds) {
      if (visited.has(childId)) continue;
      if (
        this.config.maxDepth >= 0 &&
        currentDepth > this.config.maxDepth
      ) {
        return;
      }
      if (candidateNodes.length >= this.config.maxNodes * 2) return;

      visited.add(childId);
      const child = tree.nodes.get(childId);
      if (!child) continue;

      traversalPath.push(childId);

      const similarity = this.cosineSimilarity(queryEmbedding, child.embedding);

      if (similarity >= this.config.minSimilarity) {
        candidateNodes.push({ node: child, similarity });

        // Recursively explore children
        this.exploreBranchDepthFirst(
          child,
          tree,
          queryEmbedding,
          visited,
          candidateNodes,
          traversalPath,
          currentDepth + 1
        );
      }
    }
  }

  // ============================================
  // Private Methods: Utilities
  // ============================================

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

  private extractMaterialIds(nodes: DocumentNode[]): string[] {
    const materialIds = new Set<string>();

    for (const node of nodes) {
      // Collect all material IDs from this node's subtree
      node.materialIds.forEach((id) => materialIds.add(id));
    }

    return Array.from(materialIds);
  }

  private computeMetrics(
    nodes: DocumentNode[],
    similarities: Map<string, number>,
    traversalPath: string[],
    traversalTime: number
  ): TraversalMetrics {
    // Compute max depth reached
    const maxDepthReached = nodes.reduce(
      (max, node) => Math.max(max, node.level),
      0
    );

    // Compute average similarity
    const similarityValues = Array.from(similarities.values());
    const avgSimilarity =
      similarityValues.length > 0
        ? similarityValues.reduce((sum, s) => sum + s, 0) / similarityValues.length
        : 0;

    return {
      traversalTime,
      nodesVisited: traversalPath.length,
      nodesReturned: nodes.length,
      maxDepthReached,
      avgSimilarity,
    };
  }

  // ============================================
  // Public Utility Methods
  // ============================================

  /**
   * Get current configuration
   */
  public getConfig(): TraversalConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<TraversalConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
