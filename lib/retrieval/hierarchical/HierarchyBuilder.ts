// ============================================
// HierarchyBuilder: RAPTOR Tree Construction
// ============================================

import type {
  HierarchyTree,
  DocumentNode,
  DocumentCluster,
  HierarchyConstructionOptions,
  ConstructionMetrics,
} from "./types";
import {
  DEFAULT_HIERARCHY_OPTIONS,
  DEFAULT_CLUSTERING_CONFIG,
  DEFAULT_SUMMARIZER_CONFIG,
} from "./types";
import type { CourseMaterial } from "@/lib/models/types";
import { DocumentClusterer } from "./DocumentClusterer";
import { HierarchySummarizer } from "./HierarchySummarizer";

/**
 * HierarchyBuilder: Builds RAPTOR hierarchical tree from course materials
 *
 * Algorithm:
 * 1. Create leaf nodes from course materials (level 0)
 * 2. Iteratively build hierarchy:
 *    a. Cluster nodes at current level
 *    b. For each cluster:
 *       - Summarize cluster content
 *       - Create internal node (summary + embedding)
 *    c. Internal nodes become next level's input
 * 3. Continue until stopping criteria met:
 *    - Max levels reached
 *    - Too few nodes at current level
 * 4. Build final tree structure with parent-child links
 *
 * Result: Multi-level tree where:
 * - Leaf nodes (level 0) = original course materials
 * - Internal nodes (level 1+) = summaries of child clusters
 * - Each internal node represents progressively broader concepts
 */
export class HierarchyBuilder {
  private clusterer: DocumentClusterer;
  private summarizer: HierarchySummarizer;

  constructor(options?: HierarchyConstructionOptions) {
    const clusteringConfig = {
      ...DEFAULT_CLUSTERING_CONFIG,
      ...options?.clustering,
    };
    const summarizationConfig = {
      ...DEFAULT_SUMMARIZER_CONFIG,
      ...options?.summarization,
    };

    this.clusterer = new DocumentClusterer(clusteringConfig);
    this.summarizer = new HierarchySummarizer(summarizationConfig);
  }

  /**
   * Build hierarchical tree from course materials
   */
  public async buildHierarchy(
    courseName: string,
    courseCode: string,
    materials: CourseMaterial[],
    options?: Partial<HierarchyConstructionOptions>
  ): Promise<HierarchyTree> {
    const startTime = Date.now();

    const opts = {
      ...DEFAULT_HIERARCHY_OPTIONS,
      courseName,
      courseCode,
      ...options,
    };

    // Track metrics
    let clusteringTime = 0;
    let summarizationTime = 0;
    let iterations = 0;
    let summariesGenerated = 0;
    let totalClusterSize = 0;
    let totalCohesion = 0;
    let clusterCount = 0;

    // 1. Create leaf nodes from materials
    const leafNodes = this.createLeafNodes(materials);
    const allNodes = new Map<string, DocumentNode>();
    leafNodes.forEach((node) => allNodes.set(node.id, node));

    // 2. Iteratively build hierarchy levels
    let currentLevelNodes = leafNodes;
    let currentLevel = 0;
    const rootIds: string[] = [];

    while (
      currentLevel < opts.maxLevels &&
      currentLevelNodes.length >= opts.minNodesPerLevel
    ) {
      iterations++;

      // Cluster nodes at current level
      const clusterStart = Date.now();
      const clusters = this.clusterer.clusterDocuments(currentLevelNodes);
      clusteringTime += Date.now() - clusterStart;

      if (clusters.length === 0) break;

      // Track clustering metrics
      clusters.forEach((cluster) => {
        totalClusterSize += cluster.nodes.length;
        totalCohesion += cluster.cohesion;
        clusterCount++;
      });

      // If only one cluster remains and it contains all nodes, we've reached the top
      if (
        clusters.length === 1 &&
        clusters[0].nodes.length === currentLevelNodes.length
      ) {
        // This cluster's nodes are the roots
        rootIds.push(...clusters[0].nodes.map((n) => n.id));
        break;
      }

      // Create internal nodes for each cluster
      const internalNodes: DocumentNode[] = [];

      for (const cluster of clusters) {
        const summaryStart = Date.now();
        const summaryResult = await this.summarizer.summarizeCluster(cluster);
        summarizationTime += Date.now() - summaryStart;
        summariesGenerated++;

        // Create internal node
        const internalNode = await this.createInternalNode(
          cluster,
          currentLevel + 1,
          summaryResult.summary,
          summaryResult.keywords
        );

        internalNodes.push(internalNode);
        allNodes.set(internalNode.id, internalNode);

        // Link children to parent
        for (const childNode of cluster.nodes) {
          const child = allNodes.get(childNode.id);
          if (child) {
            child.parentId = internalNode.id;
          }
        }
      }

      // If we're at the last iteration, these internal nodes are the roots
      if (
        currentLevel + 1 >= opts.maxLevels ||
        internalNodes.length < opts.minNodesPerLevel
      ) {
        rootIds.push(...internalNodes.map((n) => n.id));
      }

      // Move to next level
      currentLevelNodes = internalNodes;
      currentLevel++;
    }

    // If no roots were set (single-level tree), use leaf nodes as roots
    if (rootIds.length === 0) {
      rootIds.push(...leafNodes.map((n) => n.id));
    }

    // 3. Compute final metrics
    const totalTime = Date.now() - startTime;
    const leafCount = leafNodes.length;
    const internalCount = allNodes.size - leafCount;
    const maxDepth = this.computeMaxDepth(allNodes, rootIds);

    const metrics: ConstructionMetrics = {
      totalTime,
      clusteringTime,
      summarizationTime,
      iterations,
      summariesGenerated,
      avgClusterSize: clusterCount > 0 ? totalClusterSize / clusterCount : 0,
      avgCohesion: clusterCount > 0 ? totalCohesion / clusterCount : 0,
    };

    // 4. Build and return tree
    const tree: HierarchyTree = {
      id: `hierarchy-${courseCode}`,
      courseName,
      courseCode,
      nodes: allNodes,
      rootIds,
      maxDepth,
      leafCount,
      internalCount,
      builtAt: new Date().toISOString(),
      metrics,
    };

    return tree;
  }

  // ============================================
  // Private Methods: Node Creation
  // ============================================

  private createLeafNodes(materials: CourseMaterial[]): DocumentNode[] {
    return materials.map((material) => ({
      id: `leaf-${material.id}`,
      type: "leaf" as const,
      level: 0,
      content: material.content,
      embedding: [], // TODO: Generate embeddings via embedding service
      materialIds: [material.id],
      parentId: null,
      childIds: [],
      metadata: {
        clusterSize: 1,
        avgSimilarity: 1.0,
        topKeywords: material.keywords || [],
        weekRange: material.metadata.week ? [material.metadata.week, material.metadata.week] : undefined,
      },
    }));
  }

  private async createInternalNode(
    cluster: DocumentCluster,
    level: number,
    summary: string,
    keywords: string[]
  ): Promise<DocumentNode> {
    // Collect all material IDs from child nodes
    const materialIds = new Set<string>();
    cluster.nodes.forEach((node) => {
      node.materialIds.forEach((id) => materialIds.add(id));
    });

    // Compute week range (if applicable)
    const weekRanges = cluster.nodes
      .map((n) => n.metadata.weekRange)
      .filter((wr): wr is [number, number] => wr !== undefined);

    let weekRange: [number, number] | undefined;
    if (weekRanges.length > 0) {
      const minWeek = Math.min(...weekRanges.map((wr) => wr[0]));
      const maxWeek = Math.max(...weekRanges.map((wr) => wr[1]));
      weekRange = [minWeek, maxWeek];
    }

    return {
      id: `internal-${cluster.id}-level${level}`,
      type: "internal",
      level,
      content: summary,
      embedding: cluster.centroid,
      materialIds: Array.from(materialIds),
      parentId: null, // Will be set later if there's a parent
      childIds: cluster.nodes.map((n) => n.id),
      metadata: {
        clusterSize: cluster.nodes.length,
        avgSimilarity: cluster.cohesion,
        topKeywords: keywords,
        weekRange,
      },
    };
  }

  // ============================================
  // Private Methods: Utilities
  // ============================================

  private computeMaxDepth(
    nodes: Map<string, DocumentNode>,
    rootIds: string[]
  ): number {
    let maxDepth = 0;

    const dfs = (nodeId: string, currentDepth: number) => {
      const node = nodes.get(nodeId);
      if (!node) return;

      maxDepth = Math.max(maxDepth, currentDepth);

      for (const childId of node.childIds) {
        dfs(childId, currentDepth + 1);
      }
    };

    for (const rootId of rootIds) {
      dfs(rootId, 0);
    }

    return maxDepth;
  }

  // ============================================
  // Public Utility Methods
  // ============================================

  /**
   * Get clusterer configuration
   */
  public getClustererConfig() {
    return this.clusterer.getConfig();
  }

  /**
   * Get summarizer configuration
   */
  public getSummarizerConfig() {
    return this.summarizer.getConfig();
  }

  /**
   * Update clusterer configuration
   */
  public updateClustererConfig(config: Parameters<DocumentClusterer["updateConfig"]>[0]) {
    this.clusterer.updateConfig(config);
  }

  /**
   * Update summarizer configuration
   */
  public updateSummarizerConfig(config: Parameters<HierarchySummarizer["updateConfig"]>[0]) {
    this.summarizer.updateConfig(config);
  }
}
