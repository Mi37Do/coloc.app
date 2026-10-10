import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver, which Headless UI uses to position menus and popovers.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
