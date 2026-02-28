export function classify(value: number): number {
  if (value > 0) {
    for (let index = 0; index < value; index += 1) {
      if (index % 2 === 0) {
        value += 1;
      }
    }
  } else {
    value = value < -10 ? -10 : value;
  }

  switch (value) {
    case 1:
      return 10;
    case 2:
      return 20;
    default:
      return value;
  }
}
