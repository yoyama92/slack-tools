export const isNumber = (value: string) => {
  if (!value) {
    return false;
  }
  return Number.isFinite(Number(value));
};
