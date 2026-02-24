# Skynet Logs

This directory is intentionally empty in git. Runtime telemetry now writes to:

- `logs/token_usage_utf8.log`
- `logs/drift_metrics.jsonl`
- `logs/phase2_metrics.jsonl` (if SKYNET_METRICS_SINK targets file)

Artifacts are generated per run and should be rotated into `junk/logs-<date>/` when archived.
