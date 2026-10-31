/** xorshift32: all arithmetic is explicit uint32; zero state is excluded. */
export function nextRandom(state: number) {
  if (!Number.isInteger(state) || state < 1 || state > 0xffffffff) throw new RangeError('Invalid RNG state');
  let next = state | 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  const unsigned = next >>> 0;
  return { state: unsigned, value: unsigned / 0x100000000 };
}
