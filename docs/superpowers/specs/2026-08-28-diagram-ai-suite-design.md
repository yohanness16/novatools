# Master Specification: AI Document-to-Diagram & Architecture Visualizer Suite

**Author:** NovaTools Architecture Team  
**Date:** August 28, 2026  
**Status:** Approved Specification  
**Classification:** Client-Side Engineering & AI Diagram Engine Architecture  

---

## 1. Executive Summary & Vision

The NovaTools Diagram Suite provides **100% client-side AI-powered document-to-diagram generation**. Users can upload or paste any document (PDF, Word `.docx`, Markdown `.md`, SQL schema, OpenAPI/Swagger JSON, or plain text notes) and automatically synthesize visual diagrams:
- **Flowcharts & Process Workflows** (`flowchart TD / LR`)
- **Entity-Relationship (ER) Database Diagrams** (`erDiagram`)
- **System Architecture & C4 Component Diagrams** (`flowchart` with subgraphs)
- **Sequence Diagrams** (`sequenceDiagram` for API calls, auth flows, service interactions)
- **Class & Domain Diagrams** (`classDiagram` for OOP models & TypeScript interfaces)
- **State Machine Diagrams** (`stateDiagram-v2` for lifecycle states)
- **Mindmaps** (`mindmap` for document outlining & concept trees)
- **Gantt & Project Timeline Charts** (`gantt`)

All rendering and AI generation execute **100% locally in the browser runtime** with zero server uploads, offering instant vector SVG and PNG exports.

---

## 2. Architecture & Pipeline

```
 ┌──────────────────────────────────────────────────────────┐
 │                     INPUT SOURCES                        │
 │  • PDF Document (.pdf)     • Word Document (.docx)       │
 │  • Markdown Notes (.md)    • SQL / OpenAPI / Text        │
 └──────────────┬──────────────────┬─────────────────┬──────┘
                │                  │                 │
                ▼                  ▼                 ▼
         [PdfEngine text]    [DocEngine AST]   [Text Ingestion]
                │                  │                 │
                └──────────────────┼─────────────────┘
                                   │
                                   ▼
 ┌──────────────────────────────────────────────────────────┐
 │           In-Browser Smart AI & Heuristic Engine         │
 │  • Chrome Built-in AI (Gemini Nano Prompt API)           │
 │  • Deterministic AST Semantic Entity & Workflow Extractor│
 │  • Syntax Validator & Sanitizer (Guaranteed Valid syntax)│
 └──────────────────────────────┬───────────────────────────┘
                                │
                                ▼
 ┌──────────────────────────────────────────────────────────┐
 │              Mermaid.js Client-Side Renderer             │
 │  • Dark Indigo / Forest / Neutral / Corporate Themes     │
 │  • Interactive Pan, Zoom & Viewport Canvas               │
 │  • Live Code Editor (Monaco / Monospace)                 │
 └──────────────────────────────┬───────────────────────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
 [Export Vector SVG]     [Export 4K PNG]      [Export Mermaid .mmd]
```

---

## 3. Supported Diagram Types & Extraction Rules

| Diagram Type | Best Used For | Key Extraction Targets | Mermaid Format |
| :--- | :--- | :--- | :--- |
| **Flowchart** | Business processes, algorithms, user onboarding | Step-by-step logic, decisions (`if/else`), milestones | `flowchart TD` / `flowchart LR` |
| **ER Diagram** | Relational databases, SQL schemas, data models | Entities, attributes, primary/foreign keys, cardinality (`1:N`, `M:N`) | `erDiagram` |
| **Sequence** | API interactions, auth handshakes, microservices | Actors, messages, request/response loops, synchronous calls | `sequenceDiagram` |
| **Architecture** | Cloud infrastructure, module dependencies | Subgraphs, client-tier, server-tier, DB cluster, queues | `flowchart TB` with `subgraph` |
| **Class Diagram** | OOP design, domain entities, interfaces | Classes, methods, properties, inheritance, composition | `classDiagram` |
| **State Machine** | Document lifecycles, order statuses, connection states | States, triggers, state transitions (`-->`), end states | `stateDiagram-v2` |
| **Mindmap** | Document outlines, brainstorming, knowledge trees | Central topic, primary branches, sub-nodes | `mindmap` |
| **Gantt Chart** | Project roadmaps, sprint schedules, milestones | Tasks, start/end dates, dependencies (`after task1`) | `gantt` |

---

## 4. In-Browser AI Engine Specification (`diagramEngine.ts`)

### 4.1 AI Prompt Strategy
- Strict schema enforcement: AI outputs **ONLY** raw valid Mermaid syntax (no markdown wrapping fences, no prose explanations).
- Syntax auto-healing: Built-in linter verifies node labels (escaping parentheses, quotes, brackets), corrects direction tags, and validates balanced braces.

### 4.2 Heuristic Fallback Strategy (100% Offline)
- When no browser AI is available:
  - **Flowchart:** Parses numbered steps, bullet points, and `->` arrows in text into nodes and connections.
  - **ER Diagram:** Scans for nouns, table headers, and key-value attributes to construct entities with `string`, `int`, `boolean` types.
  - **Mindmap:** Maps Markdown `#`, `##`, `###` heading hierarchy directly into nested Mermaid mindmap indentation.
  - **Sequence:** Parses lines with "User asks...", "Client sends...", "Server responds..." into actor messages.

---

## 5. UI/UX Workspace Specification

- **Split Studio Workspace (`DiagramStudioWorkspace.tsx`):**
  - **Left Pane:** Document source / prompt input + Mermaid code editor with syntax validator and error boundary.
  - **Right Pane:** Interactive interactive visual diagram canvas (pan, zoom controls, fit-to-screen, theme switcher).
  - **Toolbar:** One-click AI diagram generators (Flowchart, ERD, Sequence, Architecture, Class, Mindmap, State).
  - **Export Actions:** Download SVG, Download PNG (High DPI), Download Code (`.mmd`), Copy SVG, Copy Code.
