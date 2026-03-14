void demo(dynamic err, String value, String message) {
  throw Exception("exception fail");
  throw StateError('state fail');
  throw ArgumentError('argument fail');
  throw FlutterError("""flutter fail""");
  throw FormatException('format fail');

  print("print fail");
  debugPrint('debug fail');

  throw Exception("hello $value");
  throw StateError(prefix + 'ignored');
  throw err;
  print(err);
  debugPrint(message);
}
