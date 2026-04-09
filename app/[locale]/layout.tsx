import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProviderWrapper>{children}</SessionProviderWrapper>
    </NextIntlClientProvider>
  )
}
