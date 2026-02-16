class CourseTree {
  final String name;
  final String language;
  final String source;
  final List<CourseSection> sections;

  CourseTree({
    required this.name,
    required this.language,
    required this.source,
    required this.sections,
  });

  factory CourseTree.fromJson(Map<String, dynamic> json) {
    return CourseTree(
      name: json['name'] as String,
      language: json['language'] as String,
      source: json['source'] as String,
      sections: (json['sections'] as List<dynamic>)
          .map((e) => CourseSection.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class CourseSection {
  final String id;
  final String title;
  final List<dynamic> pages; // keep dynamic; we reuse Lesson model from course_models.dart

  CourseSection({required this.id, required this.title, required this.pages});

  factory CourseSection.fromJson(Map<String, dynamic> json) {
    return CourseSection(
      id: json['id'] as String,
      title: json['title'] as String,
      pages: json['pages'] as List<dynamic>,
    );
  }
}
