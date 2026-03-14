import 'dart:io';

Future<int> load(bool flag) async {
  if (flag) {
    await File('input.txt').readAsString();
    return 1;
  }
  return 0;
}

class ApiClient {
  Future<void> sync(bool enabled) async {
    if (enabled) {
      await dio.post('/items');
    }
    print('done');
  }
}
