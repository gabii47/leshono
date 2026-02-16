import 'package:flutter/foundation.dart';

enum NodeState {
  locked,
  available,
  completed,
  skipped,
}

/// Very simple in-memory progress model (MVP).
///
/// Next iteration: persist to local storage.
class ProgressModel extends ChangeNotifier {
  final Set<String> _completed = <String>{};
  final Set<String> _skipped = <String>{};

  int totalXp = 0;
  int streakDays = 1;

  bool isCompleted(String nodeId) => _completed.contains(nodeId);
  bool isSkipped(String nodeId) => _skipped.contains(nodeId);

  void markCompleted(String nodeId, {int xp = 10}) {
    if (_completed.add(nodeId)) {
      totalXp += xp;
    }
    _skipped.remove(nodeId);
    notifyListeners();
  }

  void markSkipped(String nodeId) {
    if (!_completed.contains(nodeId)) {
      _skipped.add(nodeId);
      notifyListeners();
    }
  }

  /// Linear unlock rule:
  /// - nodes before first incomplete are "available"
  /// - later nodes are "locked" but still tappable (preview/skip)
  NodeState stateFor(String nodeId, {required bool isUnlocked}) {
    if (isCompleted(nodeId)) return NodeState.completed;
    if (isSkipped(nodeId)) return NodeState.skipped;
    return isUnlocked ? NodeState.available : NodeState.locked;
  }
}
