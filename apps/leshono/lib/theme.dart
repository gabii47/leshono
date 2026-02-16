import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LeshonoTheme {
  static ThemeData light() {
    final base = ThemeData(
      platform: TargetPlatform.iOS,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF58CC02),
        brightness: Brightness.light,
      ),
      useMaterial3: true,
    );

    final textTheme = GoogleFonts.ralewayTextTheme(base.textTheme).copyWith(
      titleLarge: GoogleFonts.questrial(
        fontSize: 22,
        fontWeight: FontWeight.w700,
      ),
    );

    return base.copyWith(
      textTheme: textTheme,
      scaffoldBackgroundColor: const Color(0xFFF7F7F7),
    );
  }

  static ThemeData dark() {
    final base = ThemeData(
      platform: TargetPlatform.iOS,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF58CC02),
        brightness: Brightness.dark,
      ),
      useMaterial3: true,
    );
    final textTheme = GoogleFonts.ralewayTextTheme(base.textTheme).copyWith(
      titleLarge: GoogleFonts.questrial(
        fontSize: 22,
        fontWeight: FontWeight.w700,
      ),
    );
    return base.copyWith(
      textTheme: textTheme,
      // "Dim" dark mode (not pure black)
      scaffoldBackgroundColor: const Color(0xFF12161C),
      cardColor: const Color(0xFF1B222B),
    );
  }
}
