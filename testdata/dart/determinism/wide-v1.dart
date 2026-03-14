import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart' show Widget;
import 'package:my_app/foo.dart';

abstract class Reader {
  String read(String id);
}

abstract class PaymentProvider extends Reader implements Logger {
  Future<void> charge(String id);
}

Future<int> loadData(bool flag) async {
  if (flag) {
    final host = Platform.environment['DB_HOST'];
    await File('input.txt').readAsString();
    print(host);
    return 1;
  }
  return 0;
}

void reportState() {
  debugPrint('debug fail');
  throw FormatException('format fail');
}

class ApiClient extends BaseClient implements Reader {
  Future<String> fetch() async {
    await dio.get('/items');
    return 'ok';
  }

  Future<void> push(bool enabled) async {
    if (Platform.environment.containsKey('API_TOKEN')) {
      await dio.post('/items');
      print('sent');
      return;
    }
    print('skipped');
  }

  static external String helper();

  String read(String id) => id;
}

void main() {
  group('api', () {
    test('loads data', () {});
    testWidgets('renders widget', (tester) async {});
  });
}
