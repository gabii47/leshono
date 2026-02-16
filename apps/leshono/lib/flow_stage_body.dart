import 'package:flutter/material.dart';

import 'app_settings.dart';
import 'course_models.dart';
import 'exercise_generator.dart';
import 'exercise_screen.dart';
import 'ui_lesson.dart';

class StageBody extends StatelessWidget {
  final Lesson stage;
  final AppSettings settings;
  final VoidCallback onDoneExercises;

  const StageBody({
    super.key,
    required this.stage,
    required this.settings,
    required this.onDoneExercises,
  });

  @override
  Widget build(BuildContext context) {
    final title = stage.title.toLowerCase();

    // MVP: Vocabulary pages become an MCQ drill.
    if (title.contains('vocabulary')) {
      final ex = generateVocabMcq(stage, count: 10);
      if (ex.isNotEmpty) {
        return ExerciseScreen(exercises: ex, onDone: onDoneExercises);
      }
    }

    // Otherwise show the lesson text.
    return LessonScreen(lesson: stage, scriptMode: settings.scriptMode);
  }
}
