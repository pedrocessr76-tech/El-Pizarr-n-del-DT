import '@testing-library/jest-dom/vitest';

// jsdom no implementa estas APIs de navegador que algún componente usa.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

if (!window.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub as unknown as typeof window.ResizeObserver;
}

// jsdom tira "Not implemented" para estos diálogos.
window.alert = () => {};
window.confirm = () => true;
window.prompt = () => null;

Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });

// Algunos stores usan crypto.randomUUID con fallback a Math.random.
if (!window.crypto?.randomUUID) {
  try {
    Object.defineProperty(window.crypto, 'randomUUID', {
      value: () => Math.random().toString(36).slice(2),
      writable: true,
    });
  } catch {
    // crypto puede ser de solo lectura; el fallback de Math.random cubre.
  }
}