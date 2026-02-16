import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'app_controller.dart';
import 'app_settings.dart';
import 'course_loader.dart';
import 'course_models.dart';
import 'l10n.dart';
import 'progress.dart';
import 'theme.dart';
import 'ui_shell.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppController()),
        ChangeNotifierProvider(create: (_) => ProgressModel()),
      ],
      child: const LeshonoApp(),
    ),
  );
}

class LeshonoApp extends StatelessWidget {
  const LeshonoApp({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    final settings = const AppSettings(scriptMode: ScriptMode.both);

    return MaterialApp(
      title: 'Leshono',
      debugShowCheckedModeBanner: false,
      theme: LeshonoTheme.light(),
      darkTheme: LeshonoTheme.dark(),
      themeMode: app.themeMode,
      locale: app.locale,
      supportedLocales: supportedLocales,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: FutureBuilder<Course>(
        future: CourseLoader.loadFlat(),
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Scaffold(body: Center(child: CircularProgressIndicator()));
          }
          if (snap.hasError) {
            return Scaffold(
              body: Center(child: Text('Failed to load course: ${snap.error}')),
            );
          }
          return Shell(course: snap.data!, settings: settings);
        },
      ),
    );
  }
}
