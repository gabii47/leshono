import 'package:flutter/material.dart';

class Pressable3dCircle extends StatefulWidget {
  final Color color;
  final Widget child;
  final VoidCallback onTap;
  final bool disabled;
  final double size;

  const Pressable3dCircle({
    super.key,
    required this.color,
    required this.child,
    required this.onTap,
    this.disabled = false,
    this.size = 68,
  });

  @override
  State<Pressable3dCircle> createState() => _Pressable3dCircleState();
}

class _Pressable3dCircleState extends State<Pressable3dCircle> {
  bool down = false;

  @override
  Widget build(BuildContext context) {
    final base = widget.disabled ? Colors.grey.shade300 : widget.color;
    final shadow = widget.disabled ? Colors.grey.shade400 : base.withValues(alpha: 0.55);

    final y = down ? 6.0 : 0.0;

    return GestureDetector(
      onTapDown: (_) => setState(() => down = true),
      onTapCancel: () => setState(() => down = false),
      onTapUp: (_) {
        setState(() => down = false);
        if (!widget.disabled) widget.onTap();
      },
      child: SizedBox(
        width: widget.size,
        height: widget.size + 10,
        child: Stack(
          alignment: Alignment.topCenter,
          children: [
            Positioned(
              top: 8,
              child: Container(
                width: widget.size,
                height: widget.size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: shadow,
                ),
              ),
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 60),
              curve: Curves.easeOut,
              transform: Matrix4.translationValues(0, y, 0),
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: base,
              ),
              child: widget.child,
            ),
          ],
        ),
      ),
    );
  }
}
