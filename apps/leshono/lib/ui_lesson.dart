import 'package:flutter/material.dart';

import 'app_settings.dart';
import 'course_models.dart';
import 'ui_table.dart';

class LessonScreen extends StatelessWidget {
  final Lesson lesson;
  final ScriptMode scriptMode;

  const LessonScreen({super.key, required this.lesson, required this.scriptMode});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${lesson.id}  ${lesson.title}')),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
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
                  b.text,
                  style: TextStyle(fontSize: size, fontWeight: FontWeight.w700),
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
                  text: b.text,
                  mode: scriptMode,
                ),
              );
          }
        },
      ),
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

    // Very first-pass:
    // - If the line contains Syriac and user chose Latin-only: hide it.
    // - If it contains no Syriac and user chose Syriac-only: hide it.
    if (mode == ScriptMode.latin && hasSyriac) return const SizedBox.shrink();
    if (mode == ScriptMode.syriac && !hasSyriac) return const SizedBox.shrink();

    if (hasSyriac) {
      return Directionality(
        textDirection: TextDirection.rtl,
        child: Text(
          text,
          style: const TextStyle(fontFamily: 'SertoAntochBible', fontSize: 20),
        ),
      );
    }

    return Text(text);
  }
}
