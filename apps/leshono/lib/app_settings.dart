enum ScriptMode {
  both,
  latin,
  syriac,
}

class AppSettings {
  final ScriptMode scriptMode;

  const AppSettings({required this.scriptMode});

  AppSettings copyWith({ScriptMode? scriptMode}) =>
      AppSettings(scriptMode: scriptMode ?? this.scriptMode);
}
