import 'dart:io';

Future<int> loadData(bool flag) async {
  if (flag) {
    await File('input.txt').readAsString();
    return 1;
  }
  return 0;
}

Future<void> saveData(List<int> values) async {
  for (final value in values) {
    print(value);
  }
}

class ApiClient extends BaseClient implements Reader {
  Future<String> fetch() async {
    await dio.get('/items');
    return 'ok';
  }

  Future<void> push(bool enabled) async {
    if (enabled) {
      await dio.post('/items');
      return;
    }
    print('skip');
  }

  static external String helper();
}
