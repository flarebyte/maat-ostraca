import 'dart:io';

Future<void> syncData() async {
  await File('input.txt').readAsString();
  print('saved');
}

class ApiClient {
  Future<void> status() async {
    print('ok');
    await http.get(Uri.parse('https://example.com/items'));
  }
}
