import 'dart:io';

Future<void> loadData() async {
  await File('input.txt').readAsString();
  await http.get(Uri.parse('https://example.com/items'));
  await dio.get('/items');
}

void saveData() {
  File('output.txt').writeAsString('ok');
  stdout.writeln('saved');
  print('done');
  http.post(Uri.parse('https://example.com/items'));
  dio.patch('/items');
}

void idle() {}

class ApiClient {
  Future<void> fetchData() async {
    await File(path).openRead();
    await client.get(Uri.parse('https://example.com/items'));
  }

  Future<void> pushData() async {
    await File(path).writeAsBytes(bytes);
    stdout.write('x');
    await client.post(Uri.parse('https://example.com/items'));
    http.put(Uri.parse('https://example.com/items'));
    await dio.post('/items');
  }

  void noop() {}
}
