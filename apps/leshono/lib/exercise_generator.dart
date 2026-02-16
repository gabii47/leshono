import 'dart:math';

import 'course_models.dart';
import 'exercise_models.dart';

List<McqExercise> generateVocabMcq(Lesson vocabLesson, {int count = 10}) {
  // Expect rows like: [latin, english, syriac]
  final rows = vocabLesson.blocks
      .where((b) => b.type == 'table_row')
      .map((b) => (b as dynamic).cells as List<dynamic>?)
      .where((cells) => cells != null && cells.length >= 3)
      .map((cells) => cells!.map((e) => e.toString()).toList())
      .where((cells) => cells[0].isNotEmpty && cells[1].isNotEmpty)
      .toList();

  // Skip header rows.
  final items = rows.where((c) => c[0].toLowerCase() != 'vocabulary').toList();
  if (items.isEmpty) return const [];

  final rnd = Random(1);
  items.shuffle(rnd);

  final exercises = <McqExercise>[];
  final poolLatin = items.map((c) => c[0]).toList();

  for (final it in items.take(count)) {
    final latin = it[0];
    final english = it[1];
    final syriac = it[2];

    // Build 3 distractors.
    final opts = <String>[latin];
    while (opts.length < 4 && opts.length < poolLatin.length) {
      final cand = poolLatin[rnd.nextInt(poolLatin.length)];
      if (!opts.contains(cand)) opts.add(cand);
    }
    opts.shuffle(rnd);
    final correct = opts.indexOf(latin);

    exercises.add(
      McqExercise(
        prompt: 'Choose the Surayt word for: "$english"',
        options: opts,
        correctIndex: correct,
        note: 'Syriac: $syriac',
      ),
    );
  }

  return exercises;
}
