import Link from 'next/link'
import { getLang, T } from '@/lib/i18n'
import { toggleLang } from './actions'
import Fx from './components/Fx'

export default async function Home() {
  const t = T[await getLang()]
  return (<>
    <Fx />
    <header><b>⚖️ {t.brand}</b><nav><a href="#about">{t.about}</a></nav>
      <form action={toggleLang}><button className="btn" style={{ padding: '6px 14px' }}>{t.other}</button></form></header>
    <section id="hero"><div className="sc">⚖️</div><h1>{t.title}</h1><p>{t.tag}</p>
      <div className="row"><Link className="btn" href="/login?r=owner">{t.owner}</Link><Link className="btn" href="/login?r=lawyer">{t.lawyer}</Link></div></section>
    <section id="about" className="rv"><h2>{t.about}</h2><div className="grid">
      <div className="card"><h3>{t.vision}</h3><p>{t.visionP}</p></div><div className="card"><h3>{t.mission}</h3><p>{t.missionP}</p></div><div className="card"><h3>{t.values}</h3><p>{t.valuesP}</p></div></div></section>
    <footer>© {t.title}</footer>
  </>)
}
