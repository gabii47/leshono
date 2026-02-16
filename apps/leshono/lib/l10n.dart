import 'package:flutter/material.dart';

// Minimal placeholder localizations.
// Next: add real translations via ARB files.

const supportedLocales = <Locale>[
  Locale('en'),
  Locale('de'),
  Locale('sv'),
  Locale('nl'),
  Locale('tr'),
];

String localeLabel(Locale l) {
  return switch (l.languageCode) {
    'en' => 'English',
    'de' => 'Deutsch',
    'sv' => 'Svenska',
    'nl' => 'Nederlands',
    'tr' => 'Türkçe',
    _ => l.languageCode,
  };
}
