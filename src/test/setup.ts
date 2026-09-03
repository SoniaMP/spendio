import '@testing-library/jest-dom/vitest'
import i18next from 'i18next'
import '@/i18n/config'

// Tests assert on the Spanish copy, so pin the language: jsdom reports the
// host locale and the detector would otherwise pick English.
await i18next.changeLanguage('es')
