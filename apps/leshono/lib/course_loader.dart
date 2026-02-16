import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import 'course_models.dart';
import 'course_tree_models.dart';

class CourseLoader {
  static Future<Course> loadFlat() async {
    final raw = await rootBundle.loadString('assets/data/course.json');
    final jsonMap = json.decode(raw) as Map<String, dynamic>;
    return Course.fromJson(jsonMap);
  }

  static Future<CourseTree> loadTree() async {
    final raw = await rootBundle.loadString('assets/data/course_tree.json');
    final jsonMap = json.decode(raw) as Map<String, dynamic>;
    return CourseTree.fromJson(jsonMap);
  }
}
