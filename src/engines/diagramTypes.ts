/**
 * Diagram Types & Enums for NovaTools AI Diagram Suite
 * 100% Client-Side Mermaid & Vector Architecture Visualizer
 */

export type DiagramType =
  | 'flowchart'
  | 'erDiagram'
  | 'sequenceDiagram'
  | 'architecture'
  | 'classDiagram'
  | 'stateDiagram'
  | 'mindmap'
  | 'gantt';

export type DiagramTheme = 'dark' | 'forest' | 'neutral' | 'default' | 'base';

export interface DiagramGenerationOptions {
  type: DiagramType;
  theme?: DiagramTheme;
  title?: string;
  orientation?: 'TD' | 'LR' | 'BT' | 'RL';
  maxEntities?: number;
}

export interface DiagramResult {
  code: string;
  type: DiagramType;
  title?: string;
  description?: string;
  sourceType: 'ai-prompt' | 'heuristic-ast';
}
