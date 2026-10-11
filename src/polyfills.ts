import { Buffer } from 'buffer';

// Suppress benign bigint-buffer native binding fallback warning from spl-token in browser
if (typeof console !== 'undefined' && typeof console.warn === 'function') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('bigint: Failed to load bindings')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Ensure fetch property on window has a safe setter so buggy browser polyfills (e.g. cross-fetch) don't throw
if (typeof window !== 'undefined') {
  try {
    const fetchDesc =
      Object.getOwnPropertyDescriptor(window, 'fetch') ||
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'fetch');

    if (fetchDesc && (fetchDesc.get && !fetchDesc.set)) {
      const originalFetch = window.fetch.bind(window);
      Object.defineProperty(window, 'fetch', {
        get() {
          return originalFetch;
        },
        set() {
          // No-op to satisfy scripts attempting to assign window.fetch
        },
        configurable: true,
        enumerable: true,
      });
    }
  } catch {
    // Ignore if browser prohibits redefining window.fetch
  }

  (window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
  (window as unknown as { global: typeof globalThis }).global = window;
  if (!(window as unknown as { process: unknown }).process) {
    (window as unknown as { process: { env: Record<string, string> } }).process = { env: {} };
  }
}

if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}

export { Buffer };
