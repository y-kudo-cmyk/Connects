import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ja', 'ko', 'en'],
  defaultLocale: 'ja',
  localePrefix: 'as-needed',
})
