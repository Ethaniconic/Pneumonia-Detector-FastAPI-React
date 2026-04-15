export const phaseMetrics = {
  phase1: {
    label: 'First Trained Model',
    modelFile: 'resnet18_pneumonia_best.pth',
    epoch: 1,
    train: { acc: 0.81, recall: 0.78, f1: 0.79 },
    val: { acc: 0.76, recall: 0.74, f1: 0.75 },
  },
  current: {
    label: 'Currently Deployed Model',
    modelFile: 'resnet18_pneumonia_best_finetuned.pth',
    epoch: 10,
    train: { acc: 0.93, recall: 0.91, f1: 0.92 },
    val: { acc: 0.89, recall: 0.88, f1: 0.88 },
  },
};
