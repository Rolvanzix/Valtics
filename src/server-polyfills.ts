// Suppress benign bigint-buffer native binding fallback warnings in Node environments
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('bigint: Failed to load bindings')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

export {};
