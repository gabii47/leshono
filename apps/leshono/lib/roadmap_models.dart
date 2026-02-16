enum NodeKind {
  lesson,
  exercise,
  vocabulary,
  story,
  chest,
}

class RoadmapNode {
  final String id; // stable id in app
  final String pageId; // textbook page id, e.g. 1.0.3
  final String title;
  final NodeKind kind;

  const RoadmapNode({
    required this.id,
    required this.pageId,
    required this.title,
    required this.kind,
  });
}

class RoadmapUnit {
  final String id; // e.g. 1.1
  final String title;
  final int colorSeed;
  final List<RoadmapNode> nodes;

  const RoadmapUnit({
    required this.id,
    required this.title,
    required this.colorSeed,
    required this.nodes,
  });
}
