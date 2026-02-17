/**
 * Example: Pressure-Aware Research Agent with LangChain + Skynet
 * 
 * This agent performs research tasks while monitoring cognitive stability.
 * When pressure rises, it automatically adjusts behavior (compress, optimize, or terminate).
 */

import { PressureAwareAgent } from '../src/pressure-aware-agent';
import { SerpAPITool } from 'langchain/tools';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AgentExecutor } from 'langchain/agents';

/**
 * Create a research agent that's aware of resource constraints.
 */
async function createResearchAgent() {
  // Initialize tools
  const tools = [
    new SerpAPITool({
      metadata: { essential: true }, // Mark as essential for high-pressure scenarios
    }),
    // Add other tools as needed
  ];

  // Create Skynet-aware agent
  const agent = new PressureAwareAgent(tools, {
    skynetEndpoint: 'https://skynetx.io/api/v1',
    tokenBudget: 100000, // 100K tokens available
    contextWindowSize: 200000, // 200K byte context
    checkInterval: 30, // Check pressure every 30 seconds
    handlers: {
      onPressureChange: (level) => {
        console.log(`🔵 Pressure changed to: ${level}`);
      },
      onCompressionNeeded: () => {
        console.log(`🟡 High pressure detected. Compressing context...`);
      },
      onTerminationNeeded: () => {
        console.log(`🔴 Critical pressure. Terminating gracefully.`);
      },
    },
  });

  // Create executor
  const executor = AgentExecutor.fromAgentAndTools({
    agent,
    tools,
    maxIterations: 10,
  });

  return executor;
}

/**
 * Run a research task.
 */
async function runResearch() {
  const executor = await createResearchAgent();

  const input = `
    Research and summarize the latest developments in AI safety.
    Focus on:
    1. Recent breakthroughs
    2. Key risks identified
    3. Recommended mitigations
    
    Keep research focused and efficient.
  `;

  console.log('Starting research task...\n');

  const result = await executor.call({ input });

  console.log('\nResearch complete.');
  console.log('Result:', result.output);
}

/**
 * Example with automatic recovery from high pressure.
 */
async function runResearchWithRecovery() {
  const executor = await createResearchAgent();

  const input = `
    Deep research on: What are the most promising approaches to achieving AGI safely?
    
    Analyze:
    - Technical approaches (scalable oversight, interpretability, etc.)
    - Governance and policy frameworks
    - International collaboration models
    - Timelines and feasibility
  `;

  try {
    const result = await executor.call({ input });
    console.log('Research completed successfully:', result.output);
  } catch (error) {
    // If agent was terminated due to pressure
    if (error instanceof Error && error.message.includes('SYSTEM')) {
      console.log('Agent terminated due to resource pressure.');
      console.log('Recommendation: Resume with saved checkpoint.');
    } else {
      throw error;
    }
  }
}

// Run the example
if (require.main === module) {
  runResearch().catch(console.error);
}

export { createResearchAgent, runResearch, runResearchWithRecovery };
