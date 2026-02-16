import 'course_models.dart';

import 'roadmap_models.dart';

NodeKind inferKindForPage(Lesson page) {
  final t = (page.title).toLowerCase();

  // Match the site structure
  if (t.contains('vocabulary')) return NodeKind.vocabulary;
  if (t.contains('glossary')) return NodeKind.vocabulary;

  if (t.contains('exercises')) return NodeKind.exercise;
  if (t.contains('exercise')) return NodeKind.exercise;

  if (t.contains('dialogue')) return NodeKind.story;
  if (t.contains('culture')) return NodeKind.story;
  if (t.contains('video')) return NodeKind.story;

  // Grammar pages we treat like lesson content for now.
  return NodeKind.lesson;
}

/// Build a first MVP roadmap from Section 1.
///
/// We treat pages 1.0, 1.1, 1.2, ... as "units".
/// Their children (1.1.1, 1.1.2, ...) become nodes.
List<RoadmapUnit> buildRoadmapForSection1(List<Lesson> pages) {
  // Group by unit prefix (first two numeric parts).
  final Map<String, List<Lesson>> byUnit = {};
  for (final p in pages.where((p) => p.id.startsWith('1.'))) {
    final parts = p.id.split('.');
    if (parts.length >= 2) {
      final unitId = '${parts[0]}.${parts[1]}';
      byUnit.putIfAbsent(unitId, () => []).add(p);
    }
  }

  // Units should include the parent page (e.g. 1.1) first.
  final unitIds = byUnit.keys.where((u) => u != '1.0').toList()..sort(_idCompare);

  // Duolingo-ish palette: green (beginner), purple/blue accents.
  const palette = <int>[0xFF58CC02, 0xFF8E61FF, 0xFF1EA7FF, 0xFFFFB020, 0xFFFF6B6B];
  final List<RoadmapUnit> units = [];
  var colorIndex = 0;
  for (final unitId in unitIds) {
    final pagesInUnit = byUnit[unitId]!..sort((a, b) => _idCompare(a.id, b.id));

    final unitPage = pagesInUnit.firstWhere(
      (p) => p.id == unitId,
      orElse: () => pagesInUnit.first,
    );

    final nodes = <RoadmapNode>[];

    // Make a node for the main unit page.
    nodes.add(RoadmapNode(
      id: unitPage.id,
      pageId: unitPage.id,
      title: unitPage.title,
      kind: NodeKind.lesson,
    ));

    // Add children.
    for (final child in pagesInUnit.where((p) => p.id != unitId)) {
      nodes.add(RoadmapNode(
        id: child.id,
        pageId: child.id,
        title: child.title,
        kind: inferKindForPage(child),
      ));
    }

    // Simple: map vocabulary -> chest node at end.
    // If no explicit vocabulary page, add nothing.

    final seed = palette[colorIndex % palette.length];
    colorIndex++;

    units.add(RoadmapUnit(
      id: unitId,
      title: unitPage.title,
      colorSeed: seed,
      nodes: nodes,
    ));
  }

  return units;
}

int _idCompare(String a, String b) {
  final ap = a.split('.').map((x) => int.tryParse(x) ?? 9999).toList();
  final bp = b.split('.').map((x) => int.tryParse(x) ?? 9999).toList();
  final n = ap.length < bp.length ? ap.length : bp.length;
  for (var i = 0; i < n; i++) {
    final d = ap[i] - bp[i];
    if (d != 0) return d;
  }
  return ap.length - bp.length;
}
