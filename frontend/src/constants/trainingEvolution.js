export const phaseMetrics = {
  phase1: {
    label: 'EfficientNet-B4 Phase',
    modelFile: 'pneumonia_model_eb4.pt',
    epoch: 15,
    train: { acc: 0.9954, recall: 0.9946, f1: 0.9954 },
    val: { acc: 0.9895, recall: 0.9908, f1: 0.9928 },
  },
  current: {
    label: 'DenseNet-121 (Production)',
    modelFile: 'pneumonia_model_full.pt',
    epoch: 25,
    train: { acc: 0.9240, recall: 0.9350, f1: 0.9210 }, // Ongoing optimization
    val: { acc: 0.8782, recall: 0.9564, f1: 0.9075 },   // Test metrics
  },
};
