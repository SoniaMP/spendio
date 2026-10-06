import '@testing-library/jest-dom/vitest'
import i18next from 'i18next'
import '@/i18n/config'

// Tests assert on the Spanish copy, so pin the language: jsdom reports the
// host locale and the detector would otherwise pick English.
await i18next.changeLanguage('es')

// jsdom implements neither the Pointer Capture API nor scrollIntoView, and Radix
// primitives call both. Without these, opening a Select or a DropdownMenu in a
// test throws instead of rendering its options.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
