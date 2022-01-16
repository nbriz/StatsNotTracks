/* global Chart */
window.$ = (sel) => {
  const ez = [...document.querySelectorAll(sel)]
    .map(e => { e.on = e.addEventListener; return e })
  if (ez.length === 1) return ez[0]
  else return ez
}

window.SNT = {
  _fetch: async (query, opts, callback) => {
    if (!callback) {
      try {
        const res = await window.fetch(query, opts)
        const json = await res.json()
        return json
      } catch (err) {
        return err
      }
    } else {
      window.fetch(query, opts)
        .then(res => res.json())
        .then(data => {
          if (data.error) callback(data.error)
          else callback(null, data)
        })
        .catch(err => callback(err))
    }
  },

  /*
    const login = await window.SNT.login(pw)
    const json = await window.SNT.getData()

    // or...

    window.SNT.login(pw, (err, data) => {
      if (err) console.log(err)
      else console.log(data)
    })

    window.SNT.getData((err, data) => {
      if (err) console.log(err)
      else console.log(data)
    })

  */

  login: (password, callback) => {
    const opts = {
      method: 'post',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    }
    const query = '/snt-api/login'
    return window.SNT._fetch(query, opts, callback)
  },

  logout: (callback) => {
    const opts = { method: 'post' }
    const query = '/snt-api/logout'
    return window.SNT._fetch(query, opts, callback)
  },

  getData: async (query, callback) => {
    const data = await window.SNT._fetch(query, null, callback)
    // create visitor dictionary
    data.dict = data.visitors.reduce((a, x) => ({ ...a, [x.hash]: x }), {})
    data.locations.forEach(l => { data.dict[l.hash].geo = l })
    data.hits.forEach(h => {
      if (!data.dict[h.hash].hits) data.dict[h.hash].hits = []
      data.dict[h.hash].hits.push(h)
    })
    return data
  },

  // -----------------------------
  // MAPPING DATA
  // -----------------------------

  /*
    const json = await SNT.getData()
    const views = SNT.getViews(json.dict)
  */
  getViews: (visitorDict) => {
    const pages = {}
    const cal = {}
    const referrals = {}
    const devices = {}
    const systems = {}
    const clients = {}

    const addDevice = (d, m) => {
      if (!devices[d]) devices[d] = {}
      if (!devices[d][m]) devices[d][m] = 1
      else devices[d][m]++
    }

    const addOS = (os) => {
      os = os.split('.')
      const t = os[0]
      const v = os[1]
      if (!systems[t]) systems[t] = {}
      if (!systems[t][v]) systems[t][v] = 1
      else systems[t][v]++
    }

    const addClient = (client) => {
      client = client.split('.')
      const t = client[0]
      const v = client[1]
      if (!clients[t]) clients[t] = {}
      if (!clients[t][v]) clients[t][v] = 1
      else clients[t][v]++
    }

    for (const visitor in visitorDict) {
      visitorDict[visitor].hits.forEach(h => {
        const showAct = (h.action === 'load' || h.action === 'visible')
        const dstr = window.SNT.timestamp2str(h.timestamp)
        if (!pages[h.path]) pages[h.path] = 0
        if (!cal[dstr]) cal[dstr] = 0
        if (showAct) {
          pages[h.path]++
          cal[dstr]++
        }
        // referrals
        // const ref = window.SNT.urlTrim(h.referrer)
        const r = h.referrer
        if (showAct && r && !referrals[r]) referrals[r] = 1
        else if (showAct && r && referrals[r]) referrals[r]++
      })
      // devices, systems, clients
      addDevice(visitorDict[visitor].device, visitorDict[visitor].model)
      addOS(visitorDict[visitor].os)
      addClient(visitorDict[visitor].client)
    }

    // count total views
    const views = []
    for (const page in pages) { views.push(pages[page]) }
    const total = views.length > 0 ? views.reduce((a, b) => a + b) : 0

    return { pages, cal, total, referrals, devices, systems, clients }
  },

  /*
    const json = await SNT.getData()
    const avgTimes = SNT.avgTimes(json.dict)
  */
  avgTimes: (visitorDict) => {
    const pages = {}
    for (const visitor in visitorDict) {
      visitorDict[visitor].hits.forEach(h => {
        if (!pages[h.path]) pages[h.path] = []
        pages[h.path].push({ action: h.action, time: h.timestamp })
      })
    }

    for (const page in pages) {
      const sessions = []

      pages[page].forEach(hit => {
        if (hit.action === 'load' || hit.action === 'visible') {
          const sesh = { start: hit.time, end: hit.time }
          sessions.push(sesh)
        } else if (hit.action === 'unload' || hit.action === 'hidden') {
          const lastSesh = sessions[sessions.length - 1]
          if (lastSesh) { lastSesh.end = hit.time }
        }
      })

      let avg = sessions
        .map(s => s.end - s.start)
        .filter(t => t > 0)
      avg = avg.length === 0 ? 0 : avg.reduce((a, b) => a + b) / avg.length

      if (avg === 0) delete pages[page]
      else pages[page] = avg
    }

    const avgs = Object.keys(pages).map(p => pages[p])
    const a = avgs.length > 0 ? avgs.reduce((a, b) => a + b) / avgs.length : 0
    return { pages, average: a }
  },

  // -----------------------------
  // CHARTING DATA
  // -----------------------------

  chartViews: (canvas, range, cal) => {
    if (window.SNT.chart) window.SNT.chart.destroy()
    const ctx = canvas.getContext('2d')
    const options = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item, data) => `${item.formattedValue} views`
          }
        }
      }
    }
    //
    const datasets = [{
      borderColor: '#fff',
      backgroundColor: '#fff',
      data: []
    }]
    //
    const labels = []
    const s = window.SNT.str2date(range.from)
    const e = window.SNT.str2date(range.to)
    const hrs = (e - s) / 1000 / 60 / 60
    const leapYr = (y) => ((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0)
    const m2days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (leapYr(s.getFullYear())) m2days[1] = 29
    const mStr = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    let y = s.getFullYear()
    let mi = s.getMonth()
    let d = s.getDate()
    for (let i = 0; i < (hrs / 24); i++) {
      // create label
      labels.push(`${mStr[mi]} ${d}`)
      // create data
      const str = window.SNT.date2str(new Date(y, mi, d))
      if (cal[str]) datasets[0].data.push(cal[str])
      else datasets[0].data.push(0)
      // update
      d++
      if (d >= m2days[s.getMonth()]) {
        d = 1; mi++
        if (mi > 11) {
          mi = 0
          y++
        }
      }
    }
    //
    window.SNT.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options
    })
    return window.SNT.chart
  },

  // -----------------------------
  // PARALLAX GUI
  // -----------------------------

  /*

    SNT.setupParallaxGUI({
      container: '#wrap',
      rangeEle: '#parallax-slider',
      items: [
        { el: 'header', z: 75 },
        { el: 'nav', z: 50 },
        { el: '#chart', z: 15 },
        { el: '#analytics', z: 50 }
      ]
    })

  */

  setupParallaxGUI: (opts) => {
    window.SNT._parallax = opts
    const s = document.createElement('style')
    s.setAttribute('id', 'parallax-styles')
    s.innerHTML = `${opts.container} {
        perspective: 1000px;
        perspective-origin: 30% 48%;
        transform-style: preserve-3d;
        width: 90vw;
        height: 90vh;
        margin: 10vh auto;
      }`
    document.head.appendChild(s)

    let rangeClick = false
    const range = document.querySelector(opts.rangeEle)
    range.addEventListener('input', (e) => {
      window.SNT.updateParallaxGUI(Number(e.target.value))
    })
    range.addEventListener('mousedown', (e) => { rangeClick = true })
    range.addEventListener('mouseup', (e) => { rangeClick = false })

    opts.items.forEach(item => {
      const ele = document.querySelector(item.el)
      ele.style.transform = `translateZ(${item.z}px)`
    })

    window.addEventListener('mousemove', (e) => {
      if (rangeClick) return
      const r = 100
      const x = (e.clientX / window.innerWidth) * r
      const y = (e.clientY / window.innerHeight) * r
      document.querySelector(opts.container)
        .style.perspectiveOrigin = `${x}% ${y}%`
    })

    window.SNT.updateParallaxGUI(range.value)
  },

  updateParallaxGUI: (val) => {
    const opts = window.SNT._parallax
    opts.items.forEach(item => {
      const ele = document.querySelector(item.el)
      const z = item.z * (val / 100)
      ele.style.transform = `translateZ(${z}px)`
    })
    const s = window.SNT.map(val, 0, 100, 100, 90)
    const m = window.SNT.map(val, 0, 100, 0, 10)
    const css = document.querySelector('#parallax-styles')
    css.innerHTML = `${opts.container} {
        perspective: 1000px;
        perspective-origin: 30% 48%;
        transform-style: preserve-3d;
        width: ${s}vw;
        height: ${s}vh;
        margin: ${m}vh auto;
      }`
  },

  // -----------------------------
  // LOADING SCREEN
  // -----------------------------

  loading: (status, opts) => {
    opts = opts || {}
    const loader = document.querySelector('#snt-loader')

    if (!status && loader) {
      loader.style.display = 'none'
      return
    }

    const init = () => {
      const loader = document.createElement('div')
      loader.setAttribute('id', 'snt-loader')
      const dots = document.createElement('div')
      dots.textContent = 'loading'
      loader.appendChild(dots)
      const css = document.createElement('style')
      css.innerHTML = `
        #snt-loader {
          display: grid;
          place-items: center;
          background: ${opts.background || '#000b'};
          color: ${opts.color || '#fff'};
          position: fixed;
          top: 0;
          left: 0;
          z-index: ${opts.zIndex || 10000};
          width: 100vw;
          height: 100vh;
        }

        @keyframes snt-loading {
          0% { content: ""; }
          25% { content: "."; }
          50% { content: ".."; }
          75% { content: "..."; }
          100% { content: ""; }
        }

        #snt-loader > div:before {
          content: "";
          animation: snt-loading 2s infinite;
        }

        #snt-loader > div:after {
          content: "";
          animation: snt-loading 2s infinite;
        }
      `
      loader.appendChild(css)
      document.body.appendChild(loader)
    }

    if (!loader) init()
    else loader.style.display = 'grid'
  },

  // -----------------------------
  // MISC UTILS
  // -----------------------------

  month: 1000 * 60 * 60 * 24 * 31,
  day: 1000 * 60 * 60 * 24,

  order: (dict) => {
    return Object.keys(dict)
      .map(k => ({ key: k, val: dict[k] }))
      .sort((a, b) => a.val < b.val)
  },

  tallyStats: (obj) => {
    const tally = {}
    Object.keys(obj).forEach(k => {
      tally[k] = 0
      Object.keys(obj[k]).forEach(s => {
        tally[k] += obj[k][s]
      })
    })
    return tally
  },

  tallyGeo: (locations, by) => {
    const geo = {}
    by = by || 'country'
    locations.filter(g => g.status !== 'fail').forEach(g => {
      const key = g[by]
      if (!geo[key]) geo[key] = 1
      else if (geo[key]) geo[key]++
    })
    return geo
  },

  maxStat: (obj) => {
    const arr = Object.keys(obj).map(k => obj[k])
    if (arr.length === 0) return 0
    return Math.max(...arr)
  },

  sumStat: (obj) => {
    const arr = Object.keys(obj).map(k => obj[k])
    if (arr.length === 0) return 0
    return arr.reduce((a, b) => a + b)
  },

  date2str: (date) => {
    const yer = date.getFullYear()
    let mon = date.getMonth() + 1
    let day = date.getDate()
    mon = String(mon).length === 1 ? '0' + mon : mon
    day = String(day).length === 1 ? '0' + day : day
    return `${yer}-${mon}-${day}`
  },

  str2date: (str) => {
    const a = str.split('-')
    return new Date(a[0], a[1] - 1, a[2])
  },

  str2timestamp: (str) => {
    const d = window.SNT.str2date(str)
    return d.getTime()
  },

  timestamp2str: (tc) => {
    const d = new Date(tc)
    return window.SNT.date2str(d)
  },

  ms2tc: (milliseconds) => { // milliseconds to timecode (00:00:00)
    const sec = milliseconds / 1000
    let hours = Math.floor(sec / 3600)
    let minutes = Math.floor((sec - (hours * 3600)) / 60)
    let seconds = sec - (hours * 3600) - (minutes * 60)
    seconds = Math.round(seconds)
    if (hours < 10) { hours = '0' + hours }
    if (minutes < 10) { minutes = '0' + minutes }
    if (seconds < 10) { seconds = '0' + seconds }
    return `${hours}:${minutes}:${seconds}`
  },

  abrevNum: (n) => {
    if (n < 1e3) return n
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + 'K'
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + 'M'
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + 'B'
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + 'T'
  },

  norm: (value, min, max) => { return (value - min) / (max - min) },

  lerp: (norm, min, max) => { return (max - min) * norm + min },

  map: (value, sourceMin, sourceMax, destMin, destMax) => {
    const norm = window.SNT.norm(value, sourceMin, sourceMax)
    return window.SNT.lerp(norm, destMin, destMax)
  },

  urlTrim: (s) => {
    if (s === '') s = '[DIRECT-REQUEST]'
    if (s[s.length - 1] === '/') s = s.slice(0, -1)
    if (s.includes('://')) s = s.split('://')[1]
    return s
  }
}
