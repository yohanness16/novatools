import assert from 'node:assert';
import { DiagramEngine } from '../src/engines/diagramEngine.ts';

console.log('🧪 Running Diagram Suite Engine Tests...');

const sampleDoc = `# E-Commerce Microservices Architecture

## Processing Steps
1. User authenticates with OAuth2
2. API Gateway routes request
3. Order Service validates stock
4. Payment Gateway settles transaction
5. Email Service dispatches receipt

| Entity | Attribute |
| :--- | :--- |
| User | email, password_hash |
| Order | user_id, amount, status |
`;

// 1. Test Sanitizer
const rawCodeWithFences = '```mermaid\nflowchart TD\n  A --> B\n```';
const sanitized = DiagramEngine.sanitizeMermaidCode(rawCodeWithFences);
assert.strictEqual(sanitized, 'flowchart TD\n  A --> B');
console.log('✅ DiagramEngine: Syntax Sanitization passed');

// 2. Test Flowchart Generation
const flowchart = DiagramEngine.generateHeuristicDiagram(sampleDoc, 'flowchart');
assert(flowchart.startsWith('flowchart TD'));
assert(flowchart.includes('Step1'));
assert(flowchart.includes('Step2'));
console.log('✅ DiagramEngine: Heuristic Flowchart generation passed');

// 3. Test ER Diagram Generation
const erd = DiagramEngine.generateHeuristicDiagram(sampleDoc, 'erDiagram');
assert(erd.startsWith('erDiagram'));
assert(erd.includes('USER') || erd.includes('DOCUMENT') || erd.includes('RECORD'));
console.log('✅ DiagramEngine: Heuristic ER Diagram generation passed');

// 4. Test Sequence Diagram Generation
const seq = DiagramEngine.generateHeuristicDiagram(sampleDoc, 'sequenceDiagram');
assert(seq.startsWith('sequenceDiagram'));
assert(seq.includes('actor User'));
console.log('✅ DiagramEngine: Heuristic Sequence Diagram generation passed');

// 5. Test Architecture Diagram Generation
const arch = DiagramEngine.generateHeuristicDiagram(sampleDoc, 'architecture');
assert(arch.startsWith('flowchart TB'));
assert(arch.includes('subgraph ClientTier'));
console.log('✅ DiagramEngine: Heuristic Architecture generation passed');

// 6. Test Mindmap Generation
const mindmap = DiagramEngine.generateHeuristicDiagram(sampleDoc, 'mindmap');
assert(mindmap.startsWith('mindmap'));
assert(mindmap.includes('root'));
console.log('✅ DiagramEngine: Heuristic Mindmap generation passed');

// 7. Test Class Diagram Generation
const classDiag = DiagramEngine.generateHeuristicDiagram(sampleDoc, 'classDiagram');
assert(classDiag.startsWith('classDiagram'));
console.log('✅ DiagramEngine: Heuristic Class Diagram generation passed');

// 8. Test State Diagram Generation
const stateDiag = DiagramEngine.generateHeuristicDiagram(sampleDoc, 'stateDiagram');
assert(stateDiag.startsWith('stateDiagram-v2'));
console.log('✅ DiagramEngine: Heuristic State Diagram generation passed');

// 9. Test High-Level AI Pipeline Fallback
const result = await DiagramEngine.generateDiagramFromDocument(sampleDoc, 'flowchart');
assert(result.code.length > 10);
assert.strictEqual(result.type, 'flowchart');
console.log(`✅ DiagramEngine: Universal Diagram Pipeline passed (Source: ${result.sourceType})`);

console.log('\n🎉 ALL DIAGRAM SUITE TESTS PASSED 100%!');
