import 'package:flutter/material.dart';

import 'course_models.dart';

class TableBlock extends StatelessWidget {
  final Block block;

  const TableBlock({super.key, required this.block});

  @override
  Widget build(BuildContext context) {
    final cells = (block as dynamic).cells as List<dynamic>?;
    final row = (cells ?? const <dynamic>[]).map((e) => e.toString()).toList();
    if (row.isEmpty) return const SizedBox.shrink();

    // Render as a simple row with wrap; good enough for MVP.
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Wrap(
        spacing: 10,
        runSpacing: 6,
        children: [
          for (final c in row)
            Text(
              c,
              style: const TextStyle(fontSize: 14),
            ),
        ],
      ),
    );
  }
}
