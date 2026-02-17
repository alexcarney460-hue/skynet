"""
Example: Pressure-Aware Research Agent in Python

This agent performs research with real-time Skynet cognitive monitoring.
"""

from skynet_client import (
    SkynetClient,
    PressureLevel,
    VerbosityState,
    StabilityState,
)


class ResearchAgent:
    """Agent that performs research while respecting resource constraints."""
    
    def __init__(self, max_tokens: int = 100000):
        self.skynet = SkynetClient(endpoint="https://skynetx.io/api/v1")
        self.max_tokens = max_tokens
        self.tokens_used = 0
        self.session_start_time = 0
        self.memory_history = []
        self.drift_history = []
        self.burn_rate_history = []
    
    def check_pressure(self):
        """Check cognitive pressure before expensive operations."""
        pressure = self.skynet.evaluate_pressure(
            memory_used_percent=self.estimate_memory(),
            token_burn_rate_per_min=self.estimate_burn_rate(),
            context_drift_percent=self.estimate_drift(),
            session_age_seconds=self.session_age_seconds(),
            token_budget_total=self.max_tokens,
            token_budget_used=self.tokens_used,
        )
        
        print(f"📊 Pressure: {pressure.level.value}")
        print(f"   Viability: {pressure.session_viability}/100")
        print(f"   Memory: {pressure.memory_pressure}%")
        
        return pressure
    
    def check_verbosity(self, recent_outputs: list):
        """Check if outputs are getting too verbose."""
        verbosity = self.skynet.assess_verbosity(
            recent_output_lengths=recent_outputs,
            baseline_output_length=150,
            token_budget_total=self.max_tokens,
            token_budget_used=self.tokens_used,
        )
        
        print(f"📝 Verbosity: {verbosity.state.value}")
        if verbosity.state == VerbosityState.EXCESSIVE:
            print("   ⚠️  Reducing output verbosity")
            self.enable_concise_mode()
        
        return verbosity
    
    def estimate_stability(self):
        """Check session stability and remaining lifetime."""
        stability = self.skynet.estimate_half_life(
            session_age_minutes=self.session_age_seconds() // 60,
            memory_pressure_history=self.memory_history,
            context_drift_history=self.drift_history,
            token_burn_rate_history=self.burn_rate_history,
        )
        
        print(f"⏳ Stability: {stability.stability.value}")
        print(f"   Half-Life: {stability.half_life_minutes} minutes")
        print(f"   Remaining: {stability.remaining_useful_life_minutes} minutes")
        
        if stability.should_checkpoint:
            print("   💾 Saving checkpoint...")
            self.save_checkpoint()
        
        return stability
    
    def research(self, query: str):
        """Perform research task with cognitive monitoring."""
        print(f"\n🔍 Starting research: {query}\n")
        
        # Gate 1: Check pressure before starting
        pressure = self.check_pressure()
        if pressure.level == PressureLevel.CRITICAL:
            print("❌ Critical pressure. Cannot proceed.")
            self.save_state()
            return
        
        # Gate 2: Check stability
        stability = self.estimate_stability()
        if stability.should_terminate:
            print("⏹️  Session stability at critical. Terminating gracefully.")
            self.save_state()
            return
        
        # Gate 3: Perform research with monitoring
        try:
            # Simulate research operations
            print("\n📚 Researching...")
            recent_outputs = self.simulate_research(query)
            
            # Monitor verbosity
            self.check_verbosity(recent_outputs)
            
            # Check pressure again
            if pressure.should_compress:
                print("\n🗜️  Compressing context...")
                self.compress_memory()
            
            print("\n✅ Research complete.")
            
        except Exception as e:
            print(f"\n❌ Error during research: {e}")
            self.save_state()
    
    def simulate_research(self, query: str):
        """Simulate research operations."""
        # In a real implementation, this would:
        # 1. Query search engines
        # 2. Fetch and parse documents
        # 3. Synthesize findings
        # For demo, return simulated output lengths
        return [120, 135, 145, 150, 155]
    
    def estimate_memory(self) -> int:
        """Estimate current memory usage."""
        return min(95, 40 + len(self.memory_history) * 5)
    
    def estimate_burn_rate(self) -> float:
        """Estimate token burn rate."""
        return 30.0 if len(self.burn_rate_history) == 0 else sum(self.burn_rate_history) / len(self.burn_rate_history)
    
    def estimate_drift(self) -> int:
        """Estimate context drift."""
        return min(95, 20 + len(self.drift_history) * 2)
    
    def session_age_seconds(self) -> int:
        """Get session age in seconds."""
        return 600  # Placeholder
    
    def enable_concise_mode(self):
        """Switch to concise output mode."""
        print("   → Enabled concise mode")
    
    def save_checkpoint(self):
        """Save session checkpoint."""
        print("   Checkpoint saved at checkpoint.pkl")
    
    def compress_memory(self):
        """Compress session memory."""
        print("   Memory compressed: 45% → 25%")
    
    def save_state(self):
        """Save full session state."""
        print("   Full state saved. Can resume later.")


def main():
    """Example usage."""
    agent = ResearchAgent(max_tokens=100000)
    
    # Example research task
    agent.research("What are the latest developments in AI safety?")


if __name__ == "__main__":
    main()
