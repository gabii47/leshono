import 'dart:math';

import 'course_models.dart';
import 'exercise_models.dart';

List<McqExercise> generateAlphabetLetterMcq(Lesson alphabetTableLesson, {int count = 10}) {
  // Rows like: [Name, Sound, Letter]
  final rows = alphabetTableLesson.blocks
      .where((b) => b.type == 'table_row')
      .map((b) => (b as dynamic).cells as List<dynamic>?)
      .where((cells) => cells != null && cells.length >= 3)
      .map((cells) => cells!.map((e) => e.toString()).toList())
      .where((c) => c[0].isNotEmpty && c[2].isNotEmpty)
      .toList();

  // Drop header rows.
  final items = rows.where((c) => c[0].toLowerCase() != 'name' && c[2] != 'Letter').toList();
  if (items.isEmpty) return const [];

  final rnd = Random(2);
  items.shuffle(rnd);

  final lettersPool = items.map((c) => c[2]).toList();
  final exercises = <McqExercise>[];

  for (final it in items.take(count)) {
    final name = it[0];
    final sound = it[1];
    final letter = it[2];

    final opts = <String>[letter];
    while (opts.length < 4 && opts.length < lettersPool.length) {
      final cand = lettersPool[rnd.nextInt(lettersPool.length)];
      if (!opts.contains(cand)) opts.add(cand);
    }
    opts.shuffle(rnd);
    final correct = opts.indexOf(letter);

    final s = sound == '-' ? '' : ' ($sound)';
    exercises.add(
      McqExercise(
        prompt: 'Select the Syriac letter for: $name$s',
        options: opts,
        correctIndex: correct,
      ),
    );
  }

  return exercises;
}
