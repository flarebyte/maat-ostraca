import 'dart:io';
import 'package:flutter/material.dart';
import 'package:my_app/foo.dart';
import './local.dart';
import 'package:collection/collection.dart' as collection;
import 'package:flutter/widgets.dart' show Widget;
import 'package:flutter/widgets.dart' hide BuildContext;

void main() {
  stdout.writeln(collection.IterableExtension);
}
