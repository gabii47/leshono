import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app_settings.dart';
import 'course_models.dart';
import 'progress.dart';
import 'flow_stage_body.dart';

/// Duolingo-like flow: one stage at a time with Continue.
class FlowScreen extends StatefulWidget {
  final String unitId;
  final List<Lesson> stages; // ordered
  final AppSettings settings;
  final bool unlockedAtStart;

  const FlowScreen({
    super.key,
    required this.unitId,
    required this.stages,
    required this.settings,
    required this.unlockedAtStart,
  });

  @override
  State<FlowScreen> createState() => _FlowScreenState();
}

class _FlowScreenState extends State<FlowScreen> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final progress = context.watch<ProgressModel>();
    final stage = widget.stages[index];

    // Unlock rule inside flow:
    // - if the overall unit was unlocked when you entered, stages unlock sequentially
    // - otherwise it's preview mode only
    final canProgress = widget.unlockedAtStart;

    final completed = progress.isCompleted(stage.id);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
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
                      value: (index + 1) / widget.stages.length,
                      minHeight: 10,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Row(
                    children: [
                      const Icon(Icons.local_fire_department, color: Color(0xFFFF7A00)),
                      const SizedBox(width: 4),
                      Text(progress.streakDays.toString()),
                      const SizedBox(width: 14),
                      const Text('XP', style: TextStyle(fontWeight: FontWeight.w800)),
                      const SizedBox(width: 6),
                      Text(progress.totalXp.toString(), style: const TextStyle(fontWeight: FontWeight.w700)),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: StageBody(
                stage: stage,
                allStages: widget.stages,
                settings: widget.settings,
                onDoneExercises: () {
                  // mark this stage complete and advance
                  progress.markCompleted(stage.id, xp: 10);
                  _nextOrExit(context);
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        progress.markSkipped(stage.id);
                        _nextOrExit(context);
                      },
                      child: Text(canProgress ? 'Skip' : 'Preview (Skip ahead)'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: canProgress
                          ? () {
                              // Mark complete and move on.
                              progress.markCompleted(stage.id, xp: 10);
                              _nextOrExit(context);
                            }
                          : null,
                      child: Text(index == widget.stages.length - 1 ? 'Finish' : (completed ? 'Continue' : 'Continue')),
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

  void _nextOrExit(BuildContext context) {
    if (index < widget.stages.length - 1) {
      setState(() => index++);
    } else {
      Navigator.of(context).pop();
    }
  }
}
