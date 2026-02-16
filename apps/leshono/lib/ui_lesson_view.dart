import 'package:flutter/material.dart';

import 'app_settings.dart';
import 'course_models.dart';
import 'text_cleaner.dart';
import 'ui_table.dart';

/// Pure lesson renderer (no Scaffold). Designed for embedding in a flow.
class LessonView extends StatelessWidget {
  final Lesson lesson;
  final ScriptMode scriptMode;

  const LessonView({super.key, required this.lesson, required this.scriptMode});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: lesson.blocks.length,
      itemBuilder: (context, i) {
        final b = lesson.blocks[i];
        switch (b.type) {
          case 'heading':
            final level = b.level ?? 2;
            final size = level == 1
                ? 26.0
                : level == 2
                    ? 22.0
                    : 18.0;
            return Padding(
              padding: const EdgeInsets.only(top: 14, bottom: 8),
              child: Text(
                normalizeTextForApp(b.text),
                style: TextStyle(fontSize: size, fontWeight: FontWeight.w800),
              ),
            );
          case 'embed':
          case 'image':
            // Intentionally ignored: app is plain-text + exercises.
            return const SizedBox.shrink();
          case 'table_row':
            return TableBlock(block: b);
          default:
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _ScriptAwareParagraph(
                text: normalizeTextForApp(b.text),
                mode: scriptMode,
              ),
            );
        }
      },
    );
  }
}

class _ScriptAwareParagraph extends StatelessWidget {
  final String text;
  final ScriptMode mode;

  const _ScriptAwareParagraph({required this.text, required this.mode});

  bool _looksSyriac(String s) {
    for (final r in s.runes) {
      // Syriac block: U+0700..U+074F
      if (r >= 0x0700 && r <= 0x074F) return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final hasSyriac = _looksSyriac(text);

    if (mode == ScriptMode.latin && hasSyriac) return const SizedBox.shrink();
    if (mode == ScriptMode.syriac && !hasSyriac) return const SizedBox.shrink();

    if (hasSyriac) {
      return Directionality(
        textDirection: TextDirection.rtl,
        child: Text(
          text,
          style: const TextStyle(fontFamily: 'SertoAntochBible', fontSize: 20, height: 1.25),
        ),
      );
    }

    return Text(text, style: const TextStyle(height: 1.35));
  }
}
