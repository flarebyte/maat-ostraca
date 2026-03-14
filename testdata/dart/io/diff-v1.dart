import 'dart:io';

Future<void> syncData() async {
  await File('input.txt').readAsString();
}

class ApiClient {
  void status() {
    print('ok');
  }
}
