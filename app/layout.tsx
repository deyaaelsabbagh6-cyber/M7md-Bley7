import './globals.css'
import type { Metadata, Viewport } from 'next'
import { getLang } from '@/lib/i18n'
import SW from './components/SW'
import Tr from './components/Tr'

export const metadata: Metadata = { title: 'مكتب بليح للمحاماة والاستشارات القانونية', manifest: '/manifest.webmanifest', icons: { apple: '/icon-192.png' } }
export const viewport: Viewport = { themeColor: '#070605', viewportFit: 'cover', width: 'device-width', initialScale: 1 }

export default async function Root({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}><body>{children}<SW /><Tr lang={lang} /></body></html>
}
