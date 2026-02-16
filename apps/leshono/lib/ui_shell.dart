import 'package:flutter/material.dart';

import 'app_settings.dart';
import 'course_models.dart';
import 'goals_screen.dart';
import 'profile_screen.dart';
import 'roadmap_screen.dart';

class Shell extends StatefulWidget {
  final Course course;
  final AppSettings settings;

  const Shell({super.key, required this.course, required this.settings});

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      RoadmapHome(course: widget.course, settings: widget.settings),
      const GoalsScreen(),
      ProfileScreen(settings: widget.settings),
    ];

    return Scaffold(
      body: pages[index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => setState(() => index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.emoji_events), label: 'Goals'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
