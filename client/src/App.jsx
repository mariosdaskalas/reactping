import React, { useState, useRef } from 'react'

function isValidHost(input) {
  if (!input) return false
  try {
    // If it's a full URL, URL constructor will parse it.
    new URL(input)
    return true
  } catch (e) {
    // If no protocol provided, try adding http://
    try {
      new URL('http://' + input)
      return true
    } catch (e2) {
      return false
    }
  }
}

export default function App() {
  const [target, setTarget] = useState('https://example.com')
  const [count, setCount] = useState(5)
  const [intervalMs, setIntervalMs] = useState(1000)
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)
  const controllerRef = useRef(null)

  async function pingOnce(url) {
    // Browser cannot send ICMP ping. We'll do an HTTP GET and measure time.
    // Use fetch with no-cors mode as fallback for images.
    const start = performance.now()
    let ok = false
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store', mode: 'cors' })
      const ms = Math.round(performance.now() - start)
      ok = res.ok
      return { ok, ms, status: res.status }
    } catch (e) {
      // Try image fallback which works with some hosts even when CORS blocks.
      return await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve({ ok: true, ms: Math.round(performance.now() - start), status: 0 })
        img.onerror = () => resolve({ ok: false, ms: Math.round(performance.now() - start), status: 0 })
        // append cache buster
        img.src = url + (url.includes('?') ? '&' : '?') + 'cachebust=' + Date.now()
        // abort if controller present
        if (controllerRef.current) {
          controllerRef.current.signal.addEventListener('abort', () => {
            resolve({ ok: false, ms: null, status: 'aborted' })
          })
        }
      })
    }
  }

  async function runPings() {
    if (!isValidHost(target)) {
      alert('Please enter a valid URL or host')
      return
    }
    setResults([])
    setRunning(true)
    const controller = new AbortController()
    controllerRef.current = controller

    for (let i = 0; i < count; i++) {
      if (controller.signal.aborted) break
      const r = await pingOnce(normalizeUrl(target))
      setResults((s) => [...s, r])
      if (i < count - 1) {
        await new Promise((res) => setTimeout(res, intervalMs))
      }
    }

    setRunning(false)
    controllerRef.current = null
  }

  function stop() {
    if (controllerRef.current) controllerRef.current.abort()
    setRunning(false)
  }

  function normalizeUrl(input) {
    try {
      return new URL(input).toString()
    } catch (e) {
      return 'http://' + input
    }
  }

  const successCount = results.filter((r) => r && r.ok).length
  const avgMs =
    results.filter((r) => r && typeof r.ms === 'number').reduce((a, b) => a + b.ms, 0) /
    Math.max(1, results.filter((r) => r && typeof r.ms === 'number').length)

  return (
    <div className="container">
      <h1>ReactPing (client-only)</h1>
      <p>Browser-based ping using HTTP requests. ICMP ping is not available in browsers.</p>

      <label>
        Target (URL or host):
        <input value={target} onChange={(e) => setTarget(e.target.value)} />
      </label>

      <label>
        Count:
        <input type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value))} />
      </label>

      <label>
        Interval (ms):
        <input type="number" min={100} value={intervalMs} onChange={(e) => setIntervalMs(Number(e.target.value))} />
      </label>

      <div className="controls">
        {!running ? (
          <button onClick={runPings}>Start</button>
        ) : (
          <button onClick={stop}>Stop</button>
        )}
      </div>

      <div className="stats">
        <div>Sent: {results.length}</div>
        <div>Received: {successCount}</div>
        <div>Avg (ms): {isNaN(avgMs) ? '—' : Math.round(avgMs)}</div>
      </div>

      <ul className="results">
        {results.map((r, i) => (
          <li key={i} className={r && r.ok ? 'ok' : 'fail'}>
            #{i + 1}: {r && r.ms != null ? `${r.ms} ms` : 'no response'} {r && r.status ? `(${r.status})` : ''}
          </li>
        ))}
      </ul>

      <section className="notes">
        <h3>Notes</h3>
        <ul>
          <li>Browser ping uses HTTP GETs or image loads; it's not ICMP.</li>
          <li>
            CORS can prevent accurate HTTP pings. Use a server-side proxy for reliable ICMP or unrestricted
            checks.
          </li>
          <li>Prefer providing full URL including protocol for best results (https://example.com).</li>
        </ul>
      </section>
    </div>
  )
}
