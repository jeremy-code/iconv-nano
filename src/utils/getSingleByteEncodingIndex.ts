const getSingleByteEncodingIndex = (
  encodingIndexArray: (number | null)[],
): Record<number, number> => {
  const encodingIndex: Record<number, number> = {};

  for (let index = 0; index < encodingIndexArray.length; index++) {
    const value = encodingIndexArray[index];

    if (value !== undefined && value !== null) {
      encodingIndex[value] = index;
    }
  }

  return encodingIndex;
};

export { getSingleByteEncodingIndex };
