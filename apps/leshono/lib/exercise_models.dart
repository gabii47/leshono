class McqExercise {
  final String prompt;
  final List<String> options;
  final int correctIndex;
  final String? note;

  const McqExercise({
    required this.prompt,
    required this.options,
    required this.correctIndex,
    this.note,
  });
}
