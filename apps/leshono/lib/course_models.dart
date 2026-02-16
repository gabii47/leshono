class Course {
  final String name;
  final String language;
  final String source;
  final List<Lesson> lessons;

  Course({
    required this.name,
    required this.language,
    required this.source,
    required this.lessons,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      name: json['name'] as String,
      language: json['language'] as String,
      source: json['source'] as String,
      lessons: (json['lessons'] as List<dynamic>)
          .map((e) => Lesson.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class Lesson {
  final String id;
  final String title;
  final String? urlHint;
  final List<Block> blocks;

  Lesson({
    required this.id,
    required this.title,
    required this.urlHint,
    required this.blocks,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id'] as String,
      title: json['title'] as String,
      urlHint: json['url_hint'] as String?,
      blocks: (json['blocks'] as List<dynamic>)
          .map((e) => Block.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class Block {
  final String type;
  final String text;
  final int? level;

  Block({required this.type, required this.text, this.level});

  factory Block.fromJson(Map<String, dynamic> json) {
    return Block(
      type: json['type'] as String,
      text: (json['text'] as String?) ?? '',
      level: json['level'] as int?,
    );
  }
}
