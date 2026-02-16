import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app_controller.dart';
import 'app_settings.dart';
import 'l10n.dart';

class ProfileScreen extends StatelessWidget {
  final AppSettings settings;

  const ProfileScreen({super.key, required this.settings});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              const CircleAvatar(radius: 26, child: Icon(Icons.person)),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Profile', style: Theme.of(context).textTheme.headlineSmall),
                  Text('Leshono learner', style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          _Card(
            title: 'Stats',
            child: Column(
              children: const [
                _StatRow('Total XP', '0'),
                _StatRow('Current streak', '1'),
                _StatRow('Lessons done', '0'),
                _StatRow('Beginner', '0%'),
                _StatRow('Intermediate', '0%'),
                _StatRow('Advanced', '0%'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _Card(
            title: 'Settings',
            child: Column(
              children: [
                Builder(
                  builder: (context) {
                    final app = context.watch<AppController>();
                    return SwitchListTile(
                      value: app.themeMode == ThemeMode.dark,
                      onChanged: (v) => app.setThemeMode(v ? ThemeMode.dark : ThemeMode.light),
                      title: const Text('Dark mode'),
                    );
                  },
                ),
                const Divider(height: 1),
                Builder(
                  builder: (context) {
                    final app = context.watch<AppController>();
                    return ListTile(
                      title: const Text('Interface language'),
                      subtitle: Text(localeLabel(app.locale)),
                      trailing: DropdownButtonHideUnderline(
                        child: DropdownButton<Locale>(
                          value: app.locale,
                          items: [
                            for (final l in supportedLocales)
                              DropdownMenuItem(value: l, child: Text(localeLabel(l))),
                          ],
                          onChanged: (l) {
                            if (l != null) app.setLocale(l);
                          },
                        ),
                      ),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  title: const Text('Reset progress'),
                  trailing: const Icon(Icons.delete_outline),
                  onTap: () {},
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final String title;
  final Widget child;

  const _Card({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  final String label;
  final String value;

  const _StatRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
