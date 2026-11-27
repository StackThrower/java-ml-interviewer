# MLOps and Production ML

## Key concepts
The ML lifecycle: data collection, feature engineering, training, evaluation, deployment, monitoring and retraining. Reproducibility requires versioning code, data and models (git, DVC or lakehouse snapshots, a model registry such as MLflow) and tracking experiments with parameters and metrics.

Serving patterns: batch scoring (scheduled, cheap, latency-tolerant), online real-time inference behind an API (latency budgets, autoscaling, model optimisation such as quantisation or ONNX), streaming inference. Training-serving skew happens when features are computed differently offline and online; feature stores (Feast, Tecton) provide consistent definitions and point-in-time correct joins.

Deployment strategies: shadow deployment, canary releases, A/B tests, blue-green; always have a rollback path.

Monitoring: system metrics (latency, errors, throughput), data quality (schema, null rates, ranges), data drift (input distribution change, measured with PSI or KS tests), concept drift (relationship between features and target changes), prediction drift, and model performance once labels arrive. Alert thresholds should be actionable. Retraining can be scheduled or triggered by drift, with automated validation gates before promotion.

Pipelines and orchestration: Airflow, Kubeflow, Prefect; CI/CD for ML includes data validation tests, model quality gates and integration tests. Responsible ML: fairness checks across segments, explainability, privacy.

## Core questions
Junior: What is model drift? Batch vs real-time inference — what are the differences?
Middle: What is training-serving skew and how do you prevent it? How would you safely roll out a new model version? What would you monitor for a deployed classification model?
Senior: Design an end-to-end platform so ten teams can train, deploy and monitor models reliably. Labels arrive 30 days late — how do you detect that a fraud model is degrading?

## Follow-up probes
If they mention drift: ask how to distinguish data drift from concept drift and which needs retraining. If they mention a feature store: ask what point-in-time correctness means. If they mention canary releases: ask which metrics decide promotion or rollback. If they mention retraining: ask how they prevent a bad model from being promoted automatically.

## Evaluation rubric
Strong signals: thinks in terms of the full lifecycle; concrete monitoring plan with proxies for delayed labels; safe rollout with rollback; reproducibility and skew prevention.
Weak signals: "deploy the notebook"; no monitoring beyond uptime; retrains blindly on a schedule without validation.

## Red flags
No versioning of data or models; cannot explain how to roll back; ignores training-serving skew.
