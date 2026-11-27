# Classical ML Algorithms

## Key concepts
Linear regression assumes a linear relationship and is sensitive to multicollinearity and outliers; logistic regression models log-odds and outputs probabilities; both are interpretable through coefficients when features are scaled.

Decision trees split on features to maximise impurity reduction (Gini, entropy) or variance reduction; they overfit easily. Random forests reduce variance by bagging (bootstrap samples) and random feature subsets; out-of-bag error gives a free validation estimate. Gradient boosting (XGBoost, LightGBM, CatBoost) builds trees sequentially, each fitting the residuals (negative gradients) of the previous ensemble; key hyperparameters: learning rate, number of trees, depth, subsampling, regularisation; use early stopping. Boosting usually wins on tabular data.

Other models: k-nearest neighbours (needs scaling, slow at inference), SVMs with kernels, naive Bayes (strong independence assumption, fast baseline for text). Unsupervised: k-means (choose k with elbow or silhouette; assumes spherical clusters), DBSCAN (density-based, finds arbitrary shapes and outliers), PCA (linear projection maximising variance; scale features first).

Feature engineering: categorical encoding (one-hot, target encoding out-of-fold, CatBoost ordered encoding), handling missing values, interactions, date features, log transforms for skewed variables. Feature importance: impurity-based importance is biased towards high-cardinality features; prefer permutation importance or SHAP values.

## Core questions
Junior: How does a decision tree decide where to split? Difference between bagging and boosting? Why scale features for k-NN?
Middle: Random forest vs gradient boosting — how do they reduce error differently and when would you choose each? How do you handle high-cardinality categorical features? How do you interpret feature importance reliably?
Senior: You have a tabular dataset with 50 million rows and 2000 features — how would you build a strong model efficiently? How do you explain model decisions to a regulator?

## Follow-up probes
If they mention gradient boosting: ask what the learning rate and number of trees do together and how early stopping works. If they mention feature importance: ask about the bias of impurity importance and what SHAP adds. If they mention k-means: ask how to choose k and when k-means fails.

## Evaluation rubric
Strong signals: explains bagging reduces variance while boosting reduces bias; knows practical hyperparameters and regularisation; safe encoding strategies; reliable interpretability methods.
Weak signals: can name algorithms but not how they work; always jumps to deep learning for tabular data; cannot explain why trees do not need scaling.

## Red flags
Uses target encoding computed on the full dataset; trusts impurity importance blindly; claims random forests cannot overfit at all.
