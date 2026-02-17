/**
 * Drift Detection Test Cases
 * Reference output for validation
 */

import { detectDrift } from './drift-detector.js';

console.log('=== Drift Detection Test Cases ===\n');

// Test 1: Fresh session, demo mode
console.log('Test 1: OPTIMAL (Demo Mode, Fresh Session)');
const test1 = detectDrift('demo', 0, 30);
console.log(test1);
console.log(`State: ${test1.state} (expected: OPTIMAL)`);
console.log(`Warnings: ${test1.warnings.length} (expected: 0)\n`);

// Test 2: Stable production session
console.log('Test 2: STABLE (Production Mode, 900s)');
const test2 = detectDrift('production', 900, 50);
console.log(test2);
console.log(`State: ${test2.state} (expected: STABLE)`);
console.log(`Warnings: ${test2.warnings.length} (expected: 1-2)\n`);

// Test 3: Degraded diagnostic mode
console.log('Test 3: DEGRADED (Diagnostic Mode, 1800s, High Context)');
const test3 = detectDrift('diagnostic', 1800, 75);
console.log(test3);
console.log(`State: ${test3.state} (expected: DEGRADED)`);
console.log(`Warnings: ${test3.warnings.length} (expected: 2-3)\n`);

// Test 4: At risk - long session
console.log('Test 4: AT_RISK (Production Mode, 3600s, Critical Context)');
const test4 = detectDrift('production', 3600, 85);
console.log(test4);
console.log(`State: ${test4.state} (expected: AT_RISK)`);
console.log(`Warnings: ${test4.warnings.length} (expected: 3-4)\n`);

// Test 5: Determinism check (same inputs = same outputs)
console.log('Test 5: Determinism Check');
const det1 = detectDrift('production', 1200, 60);
const det2 = detectDrift('production', 1200, 60);
console.log(`Run 1: ${det1.coherenceScore}/100`);
console.log(`Run 2: ${det2.coherenceScore}/100`);
console.log(`Deterministic: ${det1.coherenceScore === det2.coherenceScore} (expected: true)\n`);

// Output formatting examples
console.log('=== Output Formatting ===\n');

const examples = [
  { mode: 'demo', age: 0, context: 30 },
  { mode: 'production', age: 900, context: 50 },
  { mode: 'production', age: 2700, context: 75 },
  { mode: 'diagnostic', age: 3600, context: 90 },
];

examples.forEach(({ mode, age, context }) => {
  const result = detectDrift(mode as 'demo' | 'production' | 'diagnostic', age, context);
  console.log(`[${mode.toUpperCase()}] Age=${age}s, Context=${context}%`);
  console.log(`  State: ${result.state}`);
  console.log(`  Drift: ${result.contextDrift}% | Burn: ${result.tokenBurnRate} t/min`);
  console.log(`  Coherence: ${result.coherenceScore}/100 | Memory: ${result.memoryPressure}%`);
  if (result.warnings.length > 0) {
    console.log(`  Warnings: ${result.warnings.join(' | ')}`);
  }
  console.log();
});

export {};
