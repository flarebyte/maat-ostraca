export const createBraceDepthCounter = () => {
  let depth = 0;
  let maximum = 0;
  return {
    visit(char: string | undefined) {
      if (char === '{') maximum = Math.max(maximum, ++depth);
      else if (char === '}') depth = Math.max(0, depth - 1);
    },
    maximum: () => maximum,
  };
};
