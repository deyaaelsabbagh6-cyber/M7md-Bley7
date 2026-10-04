'use client'
import { useEffect, useRef, useState } from 'react'
// خلفية متحركة + دخان ذهبي + شاشة بداية سينمائية + 3D tilt + scroll reveal
export default function Fx() {
  const cv = useRef<HTMLCanvasElement>(null)
  const [off, setOff] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOff(true), 3400)
    const c = cv.current!, x = c.getContext('2d')!; let W = 0, H = 0, raf = 0, mx = 0
    const rs = () => { W = c.width = innerWidth; H = c.height = innerHeight }; rs(); addEventListener('resize', rs)
    const np = (init?: boolean) => ({ x: Math.random() * W, y: init ? H * (.3 + Math.random() * .7) : H * (.85 + Math.random() * .2), r: 60 + Math.random() * 120, vy: .25 + Math.random() * .6, ph: Math.random() * 6, a: .05 + Math.random() * .09 })
    const N = innerWidth < 800 ? 60 : 110, P = Array.from({ length: N }, () => np(true))
    const mv = (e: PointerEvent) => { mx = (e.clientX / W - .5) * 2 }; addEventListener('pointermove', mv)
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches
    const fr = () => {
      x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'
      P.forEach((p, i) => {
        p.y -= p.vy; p.ph += .008; p.x += Math.sin(p.ph) * .6 + mx * .3; p.r += .12
        const al = p.a * Math.min(1, (p.y + 60) / H * 2), g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
        g.addColorStop(0, `rgba(255,170,60,${al})`); g.addColorStop(1, 'rgba(212,175,55,0)')
        x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); if (p.y < -p.r) P[i] = np()
      })
      if (!reduce) raf = requestAnimationFrame(fr)
    }
    fr()
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('in', e.isIntersecting)), { threshold: .15 })
    document.querySelectorAll('.rv').forEach((e) => io.observe(e))
    document.querySelectorAll<HTMLElement>('.card').forEach((el) => {
      el.onpointermove = (e) => { const r = el.getBoundingClientRect(); el.style.transform = `rotateY(${((e.clientX - r.left) / r.width - .5) * 10}deg) rotateX(${-((e.clientY - r.top) / r.height - .5) * 10}deg)` }
      el.onpointerleave = () => (el.style.transform = '')
    })
    return () => { clearTimeout(t); cancelAnimationFrame(raf); removeEventListener('resize', rs); removeEventListener('pointermove', mv); io.disconnect() }
  }, [])
  return (<>
    <div id="bg" /><div id="glowfx" /><canvas id="smoke" ref={cv} />
    <div id="intro" className={off ? 'off' : ''}><div className="line" /><div className="sc">⚖️</div><h1>مكتب بليح</h1><p>للمحاماة والاستشارات القانونية</p></div>
  </>)
}
