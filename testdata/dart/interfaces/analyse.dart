abstract class Reader {
  String read(String id);
}

abstract class PaymentProvider extends Reader implements Logger, Chargeable {
  Future<void> charge(String id);
  String format(int x);
  void withBody() {}
}

class Worker extends Reader {
  @override
  String read(String id) => id;
}
