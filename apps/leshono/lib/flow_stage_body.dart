import 'package:flutter/material.dart';

import 'app_settings.dart';
import 'course_models.dart';
import 'exercise_generator.dart';
import 'exercise_generator_alphabet.dart';
import 'exercise_screen.dart';
import 'ui_lesson.dart';

class StageBody extends StatelessWidget {
  final Lesson stage;
  final List<Lesson> allStages;
  final AppSettings settings;
  final VoidCallback onDoneExercises;

  const StageBody({
    super.key,
    required this.stage,
    required this.allStages,
    required this.settings,
    required this.onDoneExercises,
  });

  @override
  Widget build(BuildContext context) {
    final title = stage.title.toLowerCase();

    // Vocabulary pages -> MCQ drill.
    if (title.contains('vocabulary')) {
      final ex = generateVocabMcq(stage, count: 10);
      if (ex.isNotEmpty) {
        return ExerciseScreen(exercises: ex, onDone: onDoneExercises);
      }
    }

    // Exercises pages in Alphabet units -> generate letter MCQs from the alphabet table page.
    if (title == 'exercises' || title.contains('exercises')) {
      // Find the Surayt alphabet table stage in the same unit (often 1.1.2)
      final alpha = allStages
          .where((s) => s.title.toLowerCase().contains('syriac script'))
          .toList();
      if (alpha.isNotEmpty) {
        final ex = generateAlphabetLetterMcq(alpha.first, count: 12);
        if (ex.isNotEmpty) {
          return ExerciseScreen(exercises: ex, onDone: onDoneExercises);
        }
      }
    }

    // Otherwise show the lesson text.
    return LessonScreen(lesson: stage, scriptMode: settings.scriptMode);
  }
}
