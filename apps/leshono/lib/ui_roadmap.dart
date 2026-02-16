import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'course_models.dart';
import 'progress.dart';
import 'roadmap_builder.dart';
import 'roadmap_models.dart';
import 'ui_3d_button.dart';

class RoadmapScreen extends StatelessWidget {
  final List<Lesson> pages;
  final ProgressModel progress;
  final void Function(Lesson page, {required bool unlocked}) openPage;

  const RoadmapScreen({
    super.key,
    required this.pages,
    required this.progress,
    required this.openPage,
  });

  @override
  Widget build(BuildContext context) {
    final units = buildRoadmapForSection1(pages);

    // Flatten nodes for unlock logic.
    final allNodes = <RoadmapNode>[];
    for (final u in units) {
      allNodes.addAll(u.nodes);
    }

    bool unlockedSoFar = true;
    final nodeUnlocked = <String, bool>{};
    for (final n in allNodes) {
      nodeUnlocked[n.id] = unlockedSoFar;
      if (!progress.isCompleted(n.id)) {
        unlockedSoFar = false;
      }
    }

    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 96),
      itemCount: units.length,
      itemBuilder: (context, unitIndex) {
        final unit = units[unitIndex];
        final cs = ColorScheme.fromSeed(
          seedColor: Color(unit.colorSeed),
          brightness: Theme.of(context).brightness,
        );

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _UnitHeader(unit: unit, cs: cs),
            const SizedBox(height: 10),
            _UnitPath(
              unit: unit,
              cs: cs,
              progress: progress,
              nodeUnlocked: nodeUnlocked,
              pages: pages,
              openPage: openPage,
            ),
            const SizedBox(height: 24),
          ],
        );
      },
    );
  }
}

class _UnitHeader extends StatelessWidget {
  final RoadmapUnit unit;
  final ColorScheme cs;

  const _UnitHeader({required this.unit, required this.cs});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Container(
        decoration: BoxDecoration(
          color: cs.primary,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    unit.id.toUpperCase(),
                    style: TextStyle(
                      color: cs.onPrimary.withValues(alpha: 0.9),
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    unit.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: cs.onPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Container(
              decoration: BoxDecoration(
                color: cs.onPrimary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.all(10),
              child: Icon(Icons.list_alt, color: cs.onPrimary),
            ),
          ],
        ),
      ),
    );
  }
}

class _UnitPath extends StatelessWidget {
  final RoadmapUnit unit;
  final ColorScheme cs;
  final ProgressModel progress;
  final Map<String, bool> nodeUnlocked;
  final List<Lesson> pages;
  final void Function(Lesson page, {required bool unlocked}) openPage;

  const _UnitPath({
    required this.unit,
    required this.cs,
    required this.progress,
    required this.nodeUnlocked,
    required this.pages,
    required this.openPage,
  });

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final centerX = width / 2;

    return SizedBox(
      height: math.max(220, 120.0 * unit.nodes.length),
      child: Stack(
        children: [
          for (var i = 0; i < unit.nodes.length; i++)
            Positioned(
              top: 30.0 + i * 110.0,
              left: _xFor(i, centerX) - 34,
              child: _NodeButton(
                node: unit.nodes[i],
                cs: cs,
                state: progress.stateFor(
                  unit.nodes[i].id,
                  isUnlocked: nodeUnlocked[unit.nodes[i].id] ?? false,
                ),
                onTap: () {
                  final page = pages.firstWhere((p) => p.id == unit.nodes[i].pageId);
                  openPage(page, unlocked: nodeUnlocked[unit.nodes[i].id] ?? false);
                },
              ),
            ),
        ],
      ),
    );
  }

  double _xFor(int i, double centerX) {
    // gentle zig-zag like Duolingo
    final delta = (i % 2 == 0) ? -70.0 : 70.0;
    return centerX + delta;
  }
}

class _NodeButton extends StatelessWidget {
  final RoadmapNode node;
  final ColorScheme cs;
  final NodeState state;
  final VoidCallback onTap;

  const _NodeButton({
    required this.node,
    required this.cs,
    required this.state,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isLocked = state == NodeState.locked;
    final bg = switch (state) {
      NodeState.completed => cs.primary,
      NodeState.available => cs.primary,
      NodeState.skipped => cs.tertiary,
      NodeState.locked => Colors.grey.shade300,
    };
    final fg = isLocked ? Colors.grey.shade600 : cs.onPrimary;

    final ringColor = state == NodeState.completed
        ? Colors.white.withValues(alpha: 0.85)
        : Colors.white.withValues(alpha: 0.35);

    final icon = switch (node.kind) {
      NodeKind.exercise => Icons.star,
      NodeKind.vocabulary => Icons.menu_book,
      NodeKind.story => Icons.play_arrow,
      NodeKind.chest => Icons.inventory_2,
      NodeKind.lesson => Icons.star_border,
    };

    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 76,
              height: 76,
              child: CircularProgressIndicator(
                value: state == NodeState.completed ? 1 : 0,
                strokeWidth: 6,
                color: ringColor,
                backgroundColor: Colors.white.withValues(alpha: 0.15),
              ),
            ),
            Pressable3dCircle(
              color: bg,
              disabled: false,
              onTap: onTap,
              child: Center(
                child: Icon(
                  state == NodeState.completed ? Icons.check : icon,
                  color: fg,
                  size: 32,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        SizedBox(
          width: 160,
          child: Text(
            node.title,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}
