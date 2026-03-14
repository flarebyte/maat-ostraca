external String lookup(String id);

Future<void> boot(BuildContext context) async {
  print(context);
}

class Worker {}

abstract class PaymentService extends BaseService implements Chargeable, Logger {
  PaymentService();
  PaymentService.named();

  Future<void> charge(
    BuildContext context,
    {required String id, int count = 0},
  ) async {
    print(context);
  }

  static external String helper();

  String get label => 'x';
}
