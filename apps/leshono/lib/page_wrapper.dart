import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app_settings.dart';
import 'course_models.dart';
import 'progress.dart';
import 'ui_lesson.dart';

class PageWrapper extends StatelessWidget {
  final Lesson page;
  final ScriptMode scriptMode;
  final bool unlocked;

  const PageWrapper({
    super.key,
    required this.page,
    required this.scriptMode,
    required this.unlocked,
  });

  @override
  Widget build(BuildContext context) {
    final progress = context.watch<ProgressModel>();
    final state = progress.stateFor(page.id, isUnlocked: unlocked);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Duolingo-like top bar (very MVP)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                  Expanded(
                    child: LinearProgressIndicator(
                      value: state == NodeState.completed ? 1 : null,
                      minHeight: 10,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Consumer<ProgressModel>(
                    builder: (context, p, _) {
                      return Row(
                        children: [
                          const Icon(Icons.local_fire_department, color: Color(0xFFFF7A00)),
                          const SizedBox(width: 4),
                          Text(p.streakDays.toString()),
                          const SizedBox(width: 14),
                          const Text('XP', style: TextStyle(fontWeight: FontWeight.w800)),
                          const SizedBox(width: 6),
                          Text(p.totalXp.toString(), style: const TextStyle(fontWeight: FontWeight.w700)),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            Expanded(
              child: LessonScreen(lesson: page, scriptMode: scriptMode),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        if (!unlocked) {
                          progress.markSkipped(page.id);
                        } else {
                          progress.markSkipped(page.id);
                        }
                        Navigator.of(context).pop();
                      },
                      child: Text(unlocked ? 'Skip' : 'Preview (Skip ahead)'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: unlocked
                          ? () {
                              progress.markCompleted(page.id, xp: 10);
                              Navigator.of(context).pop();
                            }
                          : null,
                      child: const Text('Complete'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
