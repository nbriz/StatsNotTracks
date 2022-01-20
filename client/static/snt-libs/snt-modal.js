/* global SNT */
class SNTModal extends window.HTMLElement {
  connectedCallback () {
    this.render()

    window.addEventListener('keydown', (e) => {
      if (e.keyCode === 27) {
        this.querySelector('.snt-modal-wrapper').style.display = 'none'
      }
    })
  }

  // declare any attributes you want to listen for changes to
  static get observedAttributes () {
    return ['zIndex', 'bgColor']
  }

  attributeChangedCallback (attrName, oldVal, newVal) {
    // when an attribute's value changes, render the corresponding property of the same name
    if (newVal !== oldVal) this[attrName] = newVal
    // if/when the color attribute changes, re-render the html template
    SNTModal.observedAttributes.forEach(attr => {
      if (attrName === attr) this.render()
    })
  }

  async update (nfo) {
    SNT.loading(true)
    this.render(nfo)
  }

  setLiveSocket (socket) {
    this.socket = socket
  }

  render (nfo) {
    const modalInfo = (nfo && nfo.html)
      ? nfo.html : (nfo && nfo.data)
        ? '...loading...' : ''

    this.innerHTML = `
      <style>
        .snt-modal-wrapper {
          width: 100vw;
          height: 100vh;
          background: ${this.getAttribute('bgColor') || '#000b'};
          position: absolute;
          top: 0;
          left: 0;
          z-index: ${this.getAttribute('zIndex') || '100'};
          padding: 5vw;
          display: none;
        }

        .snt-modal-wrapper > div {
          background: var(--black);
          border: 1px solid var(--white);
          padding: 20px;
          max-height: calc(90vh - 40px);
          overflow: scroll;
        }

        .snt-modal-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--white);
          padding-bottom: 10px;
          margin-bottom: 10px;
        }

        .snt-modal-header > span:nth-child(2) { /* close button */
          cursor: pointer;
        }

        .snt-modal-header > span:nth-child(2):hover { /* close button */
          color: var(--red);
        }

        .snt-modal-info > p {
          max-width: 600px;
          margin: 28px auto;
        }

        .snt-modal-row {
          display: grid;
          margin: 5px 0px;
          border-bottom: 1px solid var(--white);
        }

        .snt-modal-row:hover,
        .snt-highlight {
          background: var(--white);
          color: var(--black);
        }

        .snt-grd3 { grid-template-columns: 1fr 1fr 1fr; }
        .snt-grd4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .snt-grd5 { grid-template-columns: 1fr 1fr 1fr 1fr 1fr; }
        .snt-grd5p { grid-template-columns: 1fr 1fr 1fr 1fr 1.5fr; }
        .no-border { border: none !important; }

        .snt-modal-row-details {
          height: 0px;
          padding: 0px;
          overflow: hidden;
          transition: all 0.5s;
        }

        .snt-modal-row-details > div {
          display: grid;
          grid-template-columns: 1fr 1fr 3fr;
        }

        .toggle { cursor: pointer; }
        .toggle:hover { color: var(--red); }

      </style>

      <div class="snt-modal-wrapper">
        <div>
          <div class="snt-modal-header">
            <span>${(nfo && nfo.title) ? nfo.title : ''}</span>
            <span>close [x]</span>
          </div>
          <div class="snt-modal-info">${modalInfo}</div>
        </div>
      </div>
    `

    this.settings = {
      expandedAll: false,
      hiddenBots: false,
      actFilter: 'all'
    }

    if (nfo) {
      const main = this.querySelector('.snt-modal-wrapper')
      const close = this.querySelector('.snt-modal-header > span:nth-child(2)')
      close.addEventListener('click', () => {
        this.innerHTML = ''
        main.style.display = 'none'
      })
      main.style.display = 'block'

      if (nfo.data) this.data = Object.keys(nfo.data).map(hash => nfo.data[hash])

      if (nfo.type === 'page-actions') {
        setTimeout(() => this.handleActions(this.data), 100)
      } else if (nfo.type === 'locations') {
        setTimeout(() => this.handleLocations(this.data), 100)
      } else if (nfo.type === 'live-stats') {
        setTimeout(() => this.handleLiveStats(nfo.live), 100)
      } else SNT.loading(false)
    } else SNT.loading(false)
  }

  // ----------------------------------------------------------------- >>>>>>>>>
  // ----------------------------------------------------------------- >>>>>>>>>
  // ----------------------------------------------------------------- >>>>>>>>>
  handleLiveStats (data) {
    data = data.filter(s => s.id !== this.socket.id)
    const header = this.querySelector('.snt-modal-header > span')
    header.innerHTML = `Live Visitors: ${data.length}`
    const nfo = this.querySelector('.snt-modal-info')
    if (data.length === 0) {
      nfo.innerHTML = 'No liver visitors currently on the site.'
    } else {
      data.forEach(v => {
        nfo.innerHTML += `
          <div class="snt-modal-row snt-grd5">
            <b>${v.id}</b>
            <b>${v.url}</b>
            <b>
              <a href="https://ip-api.com/${v.ip}" target="_blank">location</a>
            </b>
            <b>${v.device} (${v.model})</b>
            <b>${v.os} (${v.client})</b>
          </div>
        `
      })
    }
    SNT.loading(false)
  }

  handleLocations (data) {
    data = JSON.parse(JSON.stringify(data))
    const headerHTML = `
      VISITORS FROM: <b class="snt-highlight">${data[0].geo.country}</b> ---
      <i class="toggle">hide crawlers</i>
    `
    this._updateHeader(headerHTML, {
      '.toggle': (e) => {
        this._filterBots(e)
        this._updateLocNfo(data)
      }
    })

    this._updateLocNfo(data)

    setTimeout(() => SNT.loading(false), 200)
  }

  handleActions (data) {
    data = JSON.parse(JSON.stringify(data))
    const headerHTML = `
      PAGE ACTIONS FOR: <b class="snt-highlight">${data[0].hits[0].path}</b>
      ---
      <i class="toggle expand">expand all</i>
      ---
      <i class="toggle bots">hide crawlers</i>
      ---
      <i>filter by</i> <select class="snt-acts-select"></select>
    `
    this._updateHeader(headerHTML, {
      '.toggle.expand': (e) => this._toggleAllDetails(e),
      '.toggle.bots': (e) => {
        this._filterBots(e)
        this._updateActNfo(data)
      }
    }, '_updateActNfo')

    this._updateActNfo(data)

    setTimeout(() => SNT.loading(false), 200)
  }

  async loadAllActionsForVisitor (hash) {
    SNT.loading(true)
    const data = await SNT.getData(`/snt-api/data/hits?hash=${hash}`)
    const visi = data.dict[hash]

    const headerHTML = `
      ALL ACTIONS FOR VISITOR
      --- <i class="toggle">back</i>
      --- <i>filter by</i> <select class="snt-acts-select"></select>`
    this._updateHeader(headerHTML, {
      '.toggle': () => this.handleActions(this.data)
    }, '_updateVisNfo', [visi])

    this._updateVisNfo([visi])

    setTimeout(() => SNT.loading(false), 200)
  }

  // ----------------------------------------------------------------- >>>>>>>>>
  // ----------------------------------------------------------------- >>>>>>>>>
  // ----------------------------------------------------------------- >>>>>>>>>

  _updateHeader (html, clicks, updateMethod, altData) {
    const header = this.querySelector('.snt-modal-header > span')
    header.innerHTML = html
    // create all click-event listeners
    for (const sel in clicks) {
      const func = clicks[sel]
      header.querySelector(sel).addEventListener('click', (e) => func(e))
    }
    // if data was passed, assume we want to create a '.snt-acts-select' filter
    if (updateMethod) {
      const list = header.querySelector('.snt-acts-select')
      const addOpt = (type) => {
        const opt = document.createElement('option')
        opt.textContent = opt.value = type
        list.appendChild(opt)
      }
      addOpt('all')
      const hits = [].concat(...this.data.map(v => v.hits))
      const acts = new Set(hits.map(h => h.action))
      acts.forEach(type => addOpt(type))
      list.addEventListener('input', () => {
        this.settings.actFilter = list.value
        this[updateMethod](altData || this.data)
      })
    }
  }

  _updateActNfo (data) {
    data = this._filter2matchSettings(data)

    const nfo = this.querySelector('.snt-modal-info')
    nfo.innerHTML = ''
    data.forEach(v => {
      let deetz = ''
      v.hits.forEach(h => {
        deetz += `<div>
          <span><b>host:</b> ${h.host}</span>
          <span><b>action:</b> ${h.action}</span>
          <span><b>data:</b> <code>${h.payload}</code></span>
        </div>`
      })
      nfo.innerHTML += `
        <div class="snt-modal-row snt-grd5p">
          <b>
            #${v.id}
            <span class="toggle these-acts" data-id="${v.id}">(<b>▶</b> ${v.hits.length})</span>
            <span class="toggle all-acts" data-hash="${v.hash}">(all)</span>
          </b>
          <b>${v.model === 'Other' ? v.device : `${v.device} (${v.model})`}</b>
          <b>${v.os}</b>
          <b>${v.client}</b>
          <b>${v.geo.city}, ${v.geo.country}</b>
        </div>
        <div class="snt-modal-row-details" name="act-${v.id}">${deetz}</div>
      `
    })

    nfo.querySelectorAll('.toggle.these-acts').forEach(toggle => {
      toggle.addEventListener('click', () => this._toggleRowDetails(nfo, toggle))
    })

    nfo.querySelectorAll('.toggle.all-acts').forEach(all => {
      all.addEventListener('click', () => {
        this.loadAllActionsForVisitor(all.dataset.hash)
      })
    })
    if (this.settings.expandedAll) this._showAllDetails()
  }

  _updateLocNfo (data) {
    data = this._filter2matchSettings(data)
    const nfo = this.querySelector('.snt-modal-info')
    nfo.innerHTML = ''
    data.forEach(v => {
      nfo.innerHTML += `
        <div class="snt-modal-row snt-grd4">
          <b>${v.geo.city}, ${v.geo.regionName}</b>
          <b>${v.geo.isp}</b>
          <b>${v.model === 'Other' ? v.device : `${v.device} (${v.model})`}</b>
          <b>${v.os} (${v.client})</b>
        </div>
      `
    })
    if (this.settings.expandedAll) this._showAllDetails()
  }

  _updateVisNfo (data) {
    data = this._filter2matchSettings(data)
    const v = data[0]
    const nfo = this.querySelector('.snt-modal-info')
    let deetz = ''
    v.hits.forEach(h => {
      const d = new Date(h.timestamp)
      deetz += `<div class="snt-modal-row snt-grd3 no-border">
        <span>${h.host}${h.path}</span>
        <span>${d.toGMTString()}</span>
        <span><b>${h.action}</b> <code>${h.payload}</code></span>
      </div>`
    })
    nfo.innerHTML = `<div class="snt-modal-row snt-grd5p snt-highlight">
      <b>#${v.id}</b>
      <b>${v.model === 'Other' ? v.device : `${v.device} (${v.model})`}</b>
      <b>${v.os}</b>
      <b>${v.client}</b>
      <b>${v.geo.city}, ${v.geo.country}</b>
    </div>
    <div>${deetz}</div>`
  }

  // -------------------
  // ------------------- ---------------------
  // ------------------- --------------------- --------------------
  // ------------------- --------------------- -------------------- ------------
  // ------------------- --------------------- --------------------
  // ------------------- ---------------------
  // -------------------

  _filter2matchSettings (data) {
    data = JSON.parse(JSON.stringify(data))
    // action  type filters
    if (this.settings.actFilter !== 'all') {
      const t = this.settings.actFilter
      data = data.map(v => {
        v.hits = v.hits.filter(h => h.action === t)
        return v
      }).filter(v => v.hits.length > 0)
    }
    // show/hide bots
    if (this.settings.hiddenBots) {
      data = data.filter(v => v.device !== 'bot')
    }
    return data
  }

  _filterBots (e, method) {
    this.settings.hiddenBots = !this.settings.hiddenBots
    if (e.target.textContent === 'hide crawlers') {
      e.target.textContent = 'show crawlers'
    } else {
      e.target.textContent = 'hide crawlers'
    }
  }

  _hideAllDetails () {
    document.querySelectorAll('.snt-modal-row-details').forEach(e => {
      e.style.height = '0'; e.style.padding = '0'
    })
  }

  _showAllDetails () {
    document.querySelectorAll('.snt-modal-row-details').forEach(e => {
      e.style.height = 'auto'; e.style.padding = '10px'
    })
  }

  _toggleAllDetails (e) {
    if (e.target.textContent === 'expand all') {
      this.settings.expandedAll = true
      e.target.textContent = 'collapse all'
      this._showAllDetails()
    } else {
      this.settings.expandedAll = false
      e.target.textContent = 'expand all'
      this._hideAllDetails()
    }
  }

  _toggleRowDetails (nfo, toggle) {
    const deetz = nfo.querySelector(`[name="act-${toggle.dataset.id}"]`)
    const arrow = toggle.querySelector('b')
    if (arrow.textContent === '▶') { // show deetz
      deetz.style.height = 'auto'
      deetz.style.padding = '10px'
      arrow.textContent = '▼'
    } else { // hide deetz
      deetz.style.height = '0px'
      deetz.style.padding = '0px'
      arrow.textContent = '▶'
    }
  }
}

window.customElements.define('snt-modal', SNTModal)
