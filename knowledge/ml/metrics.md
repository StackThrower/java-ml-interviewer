# Model Evaluation Metrics

## Key concepts
Classification: accuracy is misleading on imbalanced data. Precision = TP / (TP + FP): of the predicted positives, how many are correct. Recall = TP / (TP + FN): of the actual positives, how many are found. F1 is the harmonic mean of precision and recall. The decision threshold trades precision against recall and should be chosen from business costs of false positives vs false negatives.

ROC-AUC measures ranking quality across thresholds and is insensitive to class imbalance in a way that can look optimistic; PR-AUC (average precision) is more informative when positives are rare. Log loss evaluates probability quality. Calibration: predicted probabilities should match observed frequencies; check with reliability diagrams, fix with Platt scaling or isotonic regression.

Regression: MAE is robust to outliers and interpretable; RMSE penalises large errors; MAPE breaks near zero; R-squared measures explained variance. Ranking and recommendation: precision@k, recall@k, NDCG, MAP, MRR. 

Imbalanced data: use stratified splits, class weights, resampling (undersampling, oversampling, SMOTE applied only to training folds), focal loss, appropriate metrics and threshold tuning.

Online evaluation: A/B tests with guardrail metrics, sufficient sample size and statistical power, avoiding peeking; offline metrics do not always correlate with business metrics.

## Core questions
Junior: Define precision and recall. Why is accuracy a bad metric for fraud detection?
Middle: When would you prefer PR-AUC over ROC-AUC? How would you choose a decision threshold for a model flagging fraudulent transactions? What is model calibration and why does it matter?
Senior: Offline AUC improved but the A/B test shows no business improvement — what could explain it? How do you design an evaluation for a recommender system?

## Follow-up probes
If they mention F1: ask when they would weight precision or recall more heavily (F-beta). If they mention ROC-AUC: ask how it behaves with 0.1 percent positives. If they mention SMOTE: ask where in the pipeline it must be applied. If they mention A/B testing: ask how they determine sample size and what guardrail metrics are.

## Evaluation rubric
Strong signals: picks metrics from business costs; understands threshold selection and calibration; knows the imbalance pitfalls; connects offline metrics to online experiments.
Weak signals: reports accuracy by default; confuses precision and recall; thinks AUC alone determines deployability.

## Red flags
Oversamples before splitting; cannot explain what a false positive costs in the example given; treats a single offline metric as the goal.
