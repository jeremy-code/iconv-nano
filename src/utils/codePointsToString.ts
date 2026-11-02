// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply#using_apply_and_built-in_functions
const CHUNK_SIZE = 32_768; // 2^15

const codePointsToString = (codePoints: number[]): string => {
  let result = "";

  for (let i = 0; i < codePoints.length; i += CHUNK_SIZE) {
    console.log(codePoints.slice(i, i + CHUNK_SIZE));
    result += String.fromCodePoint.apply(
      null,
      codePoints.slice(i, i + CHUNK_SIZE),
    );
  }

  return result;
};

export { codePointsToString };
