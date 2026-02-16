import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'build_info.dart';
import 'app_settings.dart';
import 'course_models.dart';
import 'page_wrapper.dart';
import 'progress.dart';
import 'ui_roadmap.dart';
import 'flow_screen.dart';

class RoadmapHome extends StatelessWidget {
  final Course course;
  final AppSettings settings;

  const RoadmapHome({super.key, required this.course, required this.settings});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          // Duolingo-like top stats row (MVP)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            child: Row(
              children: [
                const Text('🇺🇸', style: TextStyle(fontSize: 20)),
                const SizedBox(width: 10),
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
                const Spacer(),
                Text(
                  'v$buildId',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: Colors.black.withValues(alpha: 0.45)),
                ),
                const SizedBox(width: 10),
                CircleAvatar(
                  radius: 18,
                  backgroundColor: const Color(0xFFFFD54F),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/images/aram_ref_1.jpg',
                      fit: BoxFit.cover,
                      width: 36,
                      height: 36,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: Consumer<ProgressModel>(
              builder: (context, progress, _) {
                return RoadmapScreen(
                  pages: course.lessons,
                  progress: progress,
                  openPage: (page, {required unlocked}) {
                    final children = course.lessons
                        .where((p) => p.id.startsWith('${page.id}.'))
                        .toList();

                    // For unit pages (e.g., 1.1 / 1.2) start a Duolingo-like flow.
                    if (children.isNotEmpty && page.id.split('.').length == 2) {
                      children.sort((a, b) => a.id.compareTo(b.id));
                      // Duolingo-style: don't show the unit container page itself as a stage.
                      // Start directly with the first subpage (intro/content), then exercises/vocab etc.
                      final stages = <Lesson>[...children];
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => FlowScreen(
                            unitId: page.id,
                            stages: stages,
                            settings: settings,
                            unlockedAtStart: unlocked,
                          ),
                        ),
                      );
                      return;
                    }

                    // Otherwise open a single page.
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => FlowScreen(
                          unitId: page.id,
                          stages: [page],
                          settings: settings,
                          unlockedAtStart: unlocked,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
