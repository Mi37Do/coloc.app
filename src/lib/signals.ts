// Signals behave like Vue refs: components that read .value re-render when it changes
// (wired by @preact/signals-react-transform in vite.config.ts).
export { batch, computed, effect, signal, useComputed, useSignal, useSignalEffect } from '@preact/signals-react'
export type { ReadonlySignal, Signal } from '@preact/signals-react'
