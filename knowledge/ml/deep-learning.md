# Deep Learning

## Key concepts
Neural networks learn through backpropagation: the chain rule computes gradients of the loss with respect to every parameter. Activations: ReLU (and variants like GELU) avoid saturation; sigmoid and tanh saturate and cause vanishing gradients in deep networks. Vanishing and exploding gradients are addressed by careful initialisation (He, Xavier), normalisation, residual connections and gradient clipping.

Optimisers: SGD with momentum, Adam (adaptive per-parameter learning rates with first and second moment estimates), AdamW (decoupled weight decay). Learning-rate schedules: warm-up, cosine decay, step decay. Batch size interacts with learning rate.

Normalisation: batch normalisation normalises across the batch (behaves differently in training and inference, problematic for small batches); layer normalisation normalises across features per sample and is used in transformers. Regularisation: dropout, weight decay, data augmentation, early stopping, label smoothing.

Architectures: CNNs use convolution with weight sharing and local receptive fields for images; pooling; transfer learning from pretrained backbones. RNNs and LSTMs/GRUs model sequences with gating but are hard to parallelise; transformers replaced them for most sequence tasks.

Practical training: overfit a small batch first as a sanity check; monitor training and validation loss; mixed precision (fp16/bf16) for speed and memory; gradient accumulation for larger effective batch sizes; distributed training with data parallelism.

## Core questions
Junior: What is backpropagation? Why do we use non-linear activation functions? What is dropout?
Middle: What causes vanishing gradients and how do residual connections help? Batch norm vs layer norm? Adam vs SGD — when would you choose each?
Senior: Training loss diverges to NaN after a few thousand steps — how do you debug it? How do you train a model that does not fit in a single GPU's memory?

## Follow-up probes
If they mention Adam: ask what weight decay means in AdamW and why decoupling matters. If they mention batch norm: ask how it behaves at inference time. If they mention transfer learning: ask which layers they would freeze and why. For NaN losses: ask about learning rate, mixed precision overflow and gradient clipping.

## Evaluation rubric
Strong signals: precise understanding of gradient flow; practical debugging habits; sensible choices of optimisers, schedules and normalisation; awareness of memory and compute trade-offs.
Weak signals: treats networks as black boxes; cannot explain why depth causes trouble; no systematic approach to training failures.

## Red flags
Randomly changes hyperparameters without hypotheses; never checks a baseline; confuses the validation set with the training set when tuning.
