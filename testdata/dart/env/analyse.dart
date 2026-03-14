void demo(String key, String suffix) {
  final host = Platform.environment['DB_HOST'];
  final user = Platform.environment["DB_USER"]?.trim();
  final hasToken = Platform.environment.containsKey('API_TOKEN');

  final missing = Platform.environment[key];
  final combined = Platform.environment['APP_' + suffix];
  final dynamicName = Platform.environment["APP_$suffix"];
  final hasDynamic = Platform.environment.containsKey(key);
}
