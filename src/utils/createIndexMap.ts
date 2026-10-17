const createIndexMap = /* @__NO_SIDE_EFFECTS__ */ (
  values: number[],
): Record<number, number> => {
  const output: Record<number, number> = {};
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value !== undefined && value !== -1) {
      output[value] = index;
    }
  }
  return output;
};

export { createIndexMap };
