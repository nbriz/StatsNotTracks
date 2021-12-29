window.SNT = {
  post: (data, type) => {
    let prollyBot = window.navigator.webdriver
    const botScripts = ['_phantom', '__nightmare', 'Cypress', 'phantom']
    botScripts.forEach(b => { prollyBot = (window[b]) ? true : prollyBot })
    if (prollyBot) return

    data = JSON.stringify(data)
    if (type === 'beacon') {
      const btype = 'application/json; charset=UTF-8'
      const blob = new window.Blob([data], { type: btype })
      navigator.sendBeacon('/snt-api/hit', blob)
    } else {
      const post = new window.XMLHttpRequest()
      post.open('POST', '/snt-api/hit', true)
      post.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
      post.send(data)
    }
  },

  dataObj: (action, payload) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      query: window.location.search
    }
    return {
      action: action,
      referrer: document.referrer,
      host: window.location.host,
      path: window.location.pathname,
      payload: payload || viewport
    }
  },

  setup: () => {
    window.addEventListener('load', () => {
      const data = window.SNT.dataObj('load')
      window.SNT.post(data)
    })

    if (typeof window.io === 'function') window.io()

    document.addEventListener('visibilitychange', () => {
      let data
      if (document.visibilityState === 'visible') {
        data = window.SNT.dataObj('visible')
      } else if (document.visibilityState === 'hidden') {
        data = window.SNT.dataObj('hidden')
      }
      window.SNT.post(data)
    })

    window.addEventListener('beforeunload', () => {
      const data = window.SNT.dataObj('unload')
      window.SNT.post(data, 'beacon')
    })
  }
}

window.SNT.setup()
