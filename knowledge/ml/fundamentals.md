# ML Fundamentals

## Key concepts
Supervised learning (labelled data: regression, classification), unsupervised learning (clustering, dimensionality reduction), self-supervised learning (pretext tasks, the basis of modern foundation models), reinforcement learning.

Bias-variance trade-off: high bias means underfitting (model too simple), high variance means overfitting (model memorises noise). Diagnose with learning curves: a large gap between training and validation error indicates variance; both errors high indicates bias. Remedies for overfitting: more data, regularisation (L1 encourages sparsity, L2 shrinks weights), dropout, early stopping, data augmentation, simpler models. Remedies for underfitting: richer features, more capacity, less regularisation.

Data splitting: train, validation, test. The test set is touched once. K-fold cross-validation for small datasets; stratified folds for imbalanced classes; time-based splits for temporal data; group k-fold when samples from the same entity must not leak across folds.

Data leakage: information from outside the training data, or from the future, gets into features — e.g. fitting a scaler on the full dataset before splitting, target encoding without out-of-fold computation, features computed after the prediction time. Leakage produces great offline metrics and bad production results.

Gradient descent: batch, stochastic and mini-batch; the learning rate is the most important hyperparameter. Loss functions: MSE for regression, cross-entropy for classification. Feature scaling matters for gradient-based and distance-based models but not for tree models.

## Core questions
Junior: What is overfitting and how do you detect it? Difference between L1 and L2 regularisation? Why do we need a separate test set?
Middle: Explain the bias-variance trade-off with a concrete example. What is data leakage, and give two real examples? How would you validate a model trained on time-series data?
Senior: Offline metrics are great but production performance is poor — walk me through how you investigate. How do you design an evaluation protocol for a model where labels arrive with a delay of weeks?

## Follow-up probes
If they mention cross-validation: ask how it changes for time series or grouped data. If they mention regularisation: ask why L1 leads to sparse weights. If they mention leakage: ask how to compute target encoding safely. If they mention learning curves: ask what they would do if both training and validation error are high.

## Evaluation rubric
Strong signals: diagnoses bias vs variance from evidence such as learning curves; can give concrete leakage examples from experience; chooses validation schemes that mirror production; explains regularisation intuitively and mathematically.
Weak signals: textbook definitions only; uses random splits for temporal data; tunes hyperparameters on the test set.

## Red flags
Reports test-set metrics after repeatedly tuning on them; fits preprocessing on the whole dataset before splitting; believes more complex models are always better.
