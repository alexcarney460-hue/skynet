"""
Skynet Python Client Library

Simple, deterministic cognitive stability signals for Python agents.
"""

import requests
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum


class PressureLevel(Enum):
    """Cognitive pressure levels."""
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class VerbosityState(Enum):
    """Output efficiency states."""
    OPTIMAL = "OPTIMAL"
    DRIFTING = "DRIFTING"
    EXCESSIVE = "EXCESSIVE"


class StabilityState(Enum):
    """Session stability states."""
    STABLE = "STABLE"
    DECAYING = "DECAYING"
    FRAGILE = "FRAGILE"


@dataclass
class PressureAssessment:
    """Cognitive pressure evaluation result."""
    level: PressureLevel
    session_viability: int  # 0-100
    memory_pressure: int  # 0-100
    token_burn_rate: float  # tokens per minute
    context_drift: int  # 0-100
    
    should_compress: bool
    should_optimize: bool
    should_terminate: bool


@dataclass
class VerbosityAssessment:
    """Output efficiency assessment."""
    state: VerbosityState
    token_impact: str  # LOW, MODERATE, HIGH
    avg_output_length: int
    baseline_output_length: int
    drift_percentage: int
    
    truncate_output_at: Optional[int] = None
    reduce_detail_level: bool = False
    skip_meta_commentary: bool = False


@dataclass
class HalfLifeAssessment:
    """Session stability and decay prediction."""
    stability: StabilityState
    stability_score: int  # 0-100
    half_life_minutes: int
    remaining_useful_life_minutes: int
    
    should_checkpoint: bool
    should_compress: bool
    should_terminate: bool
    minutes_to_critical: int


class SkynetClient:
    """
    Client for Skynet cognitive infrastructure.
    
    Usage:
    ```python
    from skynet_client import SkynetClient
    
    client = SkynetClient(endpoint="https://skynetx.io/api/v1")
    
    # Check pressure before expensive operation
    pressure = client.evaluate_pressure(
        memory_used_percent=55,
        token_burn_rate_per_min=38,
        context_drift_percent=25,
        session_age_seconds=900
    )
    
    if pressure.level == PressureLevel.CRITICAL:
        save_state_and_exit()
    elif pressure.level == PressureLevel.HIGH:
        compress_context()
    ```
    """
    
    def __init__(
        self,
        endpoint: str = "https://skynetx.io/api/v1",
        timeout: int = 5
    ):
        """Initialize Skynet client."""
        self.endpoint = endpoint
        self.timeout = timeout
    
    def evaluate_pressure(
        self,
        memory_used_percent: int,
        token_burn_rate_per_min: float,
        context_drift_percent: int,
        session_age_seconds: int,
        token_budget_total: int = 100000,
        token_budget_used: int = 0,
        context_window_max_bytes: int = 200000,
        context_window_used_bytes: int = 0,
        system_mode: str = "production"
    ) -> PressureAssessment:
        """
        Evaluate context pressure.
        
        Returns pressure level and recommendations.
        """
        try:
            response = requests.post(
                f"{self.endpoint}/pressure",
                json={
                    "memoryUsedPercent": memory_used_percent,
                    "tokenBurnRatePerMin": token_burn_rate_per_min,
                    "contextDriftPercent": context_drift_percent,
                    "sessionAgeSeconds": session_age_seconds,
                    "tokenBudgetTotal": token_budget_total,
                    "tokenBudgetUsed": token_budget_used,
                    "contextWindowMaxBytes": context_window_max_bytes,
                    "contextWindowUsedBytes": context_window_used_bytes,
                    "systemMode": system_mode,
                },
                timeout=self.timeout
            )
            
            data = response.json()["pressure"]
            
            return PressureAssessment(
                level=PressureLevel(data["level"]),
                session_viability=data["sessionViability"],
                memory_pressure=data["memoryPressure"],
                token_burn_rate=data["tokenBurnRate"],
                context_drift=data["contextDrift"],
                should_compress=data["recommendations"]["shouldCompress"],
                should_optimize=data["recommendations"]["shouldOptimize"],
                should_terminate=data["recommendations"]["shouldTerminate"],
            )
        except Exception as e:
            # Fallback to conservative estimate
            print(f"Skynet pressure check failed: {e}. Assuming MODERATE.")
            return PressureAssessment(
                level=PressureLevel.MODERATE,
                session_viability=50,
                memory_pressure=50,
                token_burn_rate=35,
                context_drift=25,
                should_compress=False,
                should_optimize=True,
                should_terminate=False,
            )
    
    def assess_verbosity(
        self,
        recent_output_lengths: List[int],
        baseline_output_length: int = 150,
        token_budget_total: int = 100000,
        token_budget_used: int = 0,
        system_mode: str = "production"
    ) -> VerbosityAssessment:
        """
        Assess output verbosity drift.
        
        Returns efficiency state and correction recommendations.
        """
        try:
            response = requests.post(
                f"{self.endpoint}/verbosity",
                json={
                    "recentOutputLengthsTokens": recent_output_lengths,
                    "expectedBaselineTokensPerOutput": baseline_output_length,
                    "tokenBudgetTotal": token_budget_total,
                    "tokenBudgetUsed": token_budget_used,
                    "systemMode": system_mode,
                },
                timeout=self.timeout
            )
            
            data = response.json()["assessment"]
            
            return VerbosityAssessment(
                state=VerbosityState(data["verbosityState"]),
                token_impact=data["tokenImpact"],
                avg_output_length=data["avgOutputLengthTokens"],
                baseline_output_length=data["baselineOutputLengthTokens"],
                drift_percentage=data["driftPercentage"],
                truncate_output_at=data["recommendations"].get("truncateOutputAt"),
                reduce_detail_level=data["recommendations"]["reduceDetailLevel"],
                skip_meta_commentary=data["recommendations"]["skipMetaCommentary"],
            )
        except Exception as e:
            print(f"Skynet verbosity check failed: {e}. Assuming OPTIMAL.")
            return VerbosityAssessment(
                state=VerbosityState.OPTIMAL,
                token_impact="LOW",
                avg_output_length=150,
                baseline_output_length=150,
                drift_percentage=0,
            )
    
    def estimate_half_life(
        self,
        session_age_minutes: int,
        memory_pressure_history: List[int],
        context_drift_history: List[int],
        token_burn_rate_history: List[float],
        error_count_this_session: int = 0,
        system_mode: str = "production"
    ) -> HalfLifeAssessment:
        """
        Estimate session stability and remaining lifetime.
        
        Returns stability state and decay prediction.
        """
        try:
            response = requests.post(
                f"{self.endpoint}/half-life",
                json={
                    "sessionAgeMinutes": session_age_minutes,
                    "memoryPressureHistory": memory_pressure_history,
                    "contextDriftHistory": context_drift_history,
                    "tokenBurnRateHistory": token_burn_rate_history,
                    "errorCountThisSession": error_count_this_session,
                    "systemMode": system_mode,
                },
                timeout=self.timeout
            )
            
            data = response.json()["halfLife"]
            
            return HalfLifeAssessment(
                stability=StabilityState(data["estimatedStability"]),
                stability_score=data["currentStabilityScore"],
                half_life_minutes=data["estimatedHalfLifeMinutes"],
                remaining_useful_life_minutes=data["estimatedRemainingLifeMinutes"],
                should_checkpoint=data["recommendations"]["shouldSaveCheckpoint"],
                should_compress=data["recommendations"]["shouldCompress"],
                should_terminate=data["recommendations"]["shouldTerminate"],
                minutes_to_critical=data["recommendations"]["estimatedTimeBeforeCritical"],
            )
        except Exception as e:
            print(f"Skynet half-life check failed: {e}. Assuming STABLE.")
            return HalfLifeAssessment(
                stability=StabilityState.STABLE,
                stability_score=85,
                half_life_minutes=120,
                remaining_useful_life_minutes=240,
                should_checkpoint=False,
                should_compress=False,
                should_terminate=False,
                minutes_to_critical=180,
            )


# Convenience client instance
client = SkynetClient()
