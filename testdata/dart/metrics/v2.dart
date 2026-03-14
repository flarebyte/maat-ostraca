int score(int x, List<int> items) {
  if (x > 0) {
    for (final item in items) {
      if (item > 1) {
        return item;
      }
    }
  }

  return x > 1 ? x : 0;
}
