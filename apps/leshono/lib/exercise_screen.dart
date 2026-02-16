import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'exercise_models.dart';
import 'progress.dart';

class ExerciseScreen extends StatefulWidget {
  final List<McqExercise> exercises;
  final VoidCallback onDone;

  const ExerciseScreen({super.key, required this.exercises, required this.onDone});

  @override
  State<ExerciseScreen> createState() => _ExerciseScreenState();
}

class _ExerciseScreenState extends State<ExerciseScreen> {
  int index = 0;
  int? selected;
  bool checked = false;

  @override
  Widget build(BuildContext context) {
    final p = context.watch<ProgressModel>();
    final ex = widget.exercises[index];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Text(
            ex.prompt,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
        ),
        if (ex.note != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(ex.note!, style: Theme.of(context).textTheme.bodySmall),
          ),
        const SizedBox(height: 12),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: ex.options.length,
            itemBuilder: (context, i) {
              final opt = ex.options[i];
              final isSel = selected == i;
              final isCorrect = checked && i == ex.correctIndex;
              final isWrongSel = checked && isSel && i != ex.correctIndex;

              Color? bg;
              if (isCorrect) bg = const Color(0xFF58CC02).withValues(alpha: 0.18);
              if (isWrongSel) bg = Colors.red.withValues(alpha: 0.12);

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: checked
                      ? null
                      : () {
                          setState(() => selected = i);
                        },
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: bg ?? Theme.of(context).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSel ? Theme.of(context).colorScheme.primary : Colors.transparent,
                        width: 2,
                      ),
                    ),
                    child: Text(opt, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  ),
                ),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: ElevatedButton(
            onPressed: () {
              if (selected == null) return;
              if (!checked) {
                setState(() => checked = true);
                final correct = selected == ex.correctIndex;
                if (correct) {
                  p.totalXp += 10;
                }
                p.notifyListeners();
                return;
              }
              // next
              if (index < widget.exercises.length - 1) {
                setState(() {
                  index++;
                  selected = null;
                  checked = false;
                });
              } else {
                widget.onDone();
              }
            },
            child: Text(!checked ? 'Check' : (index == widget.exercises.length - 1 ? 'Finish' : 'Continue')),
          ),
        ),
      ],
    );
  }
}
