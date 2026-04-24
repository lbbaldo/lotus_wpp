export const isValidApiKey = (received: string | undefined, expected: string): boolean => {
  return typeof received === "string" && received.length > 0 && received === expected;
};
