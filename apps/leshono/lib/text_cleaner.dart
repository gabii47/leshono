String normalizeTextForApp(String s) {
  // User preference: call the language "Turoyo" in-app.
  // This does not change the source data; it's a display-layer normalization.
  return s
      .replaceAll('Surayt', 'Turoyo')
      .replaceAll('surayt', 'turoyo')
      .replaceAll('SURAYT', 'TUROYO');
}
