/* global SNT */
class SNTRow extends window.HTMLElement {
  connectedCallback () {
    this.update()
  }

  // declare any attributes you want to listen for changes to
  static get observedAttributes () {
    return ['val', 'max', 'txt']
  }

  attributeChangedCallback (attrName, oldVal, newVal) {
    // when an attribute's value changes, update the corresponding property of the same name
    if (newVal !== oldVal) this[attrName] = newVal
    // if/when the color attribute changes, re-render the html template
    SNTRow.observedAttributes.forEach(attr => {
      if (attrName === attr) this.update()
    })
  }

  update () {
    const val = Number(this.val || 0)
    const max = Number(this.max || 0)
    this.innerHTML = `
      <style>
        .row {
          margin-bottom: 1px;
          cursor: pointer;
        }

        .row > .back,
        .row > .front {
          display: flex;
          justify-content: space-between;
        }

        .row:hover > .back {
          background-color: var(--yellow);
          color: var(--black);
        }
        .row:hover > .front {
          color: var(--black);
        }

        .row > .front > .bar {
          color: var(--black);
          background-color: var(--white);
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          transition: width 0.5s;
        }

        .row:hover > .front > .bar {
          background-color: transparent;
          color: var(--black);
        }

        .row > .front > div:nth-child(1),
        .row > .back > div:nth-child(1) {
          max-width: 75%;
          white-space: nowrap;
          overflow: hidden;
        }

        .row > .back > div:nth-child(1) {
          text-overflow: ellipsis;
        }
      </style>

      <div class="row" title="${this.txt}">
        <div class="back">
          <div>${this.trm(this.txt)}</div>
          <div>${SNT.abrevNum(val)}</div>
        </div>
        <div class="front">
          <div class="bar">${this.trm(this.txt)}</div>
          <div>${SNT.abrevNum(val)}</div>
        </div>
      </div>
    `

    const front = this.querySelector('.front')
    front.style.marginTop = `-${front.offsetHeight}px`

    setTimeout(() => {
      this.querySelector('.bar').style.width = val / max * 100 + '%'
    }, 500)
  }

  trm (s) {
    if (s[s.length - 1] === '/') s = s.slice(0, -1)
    if (s.includes('://')) s = s.split('://')[1]
    return s
  }
}

window.customElements.define('snt-row', SNTRow)
