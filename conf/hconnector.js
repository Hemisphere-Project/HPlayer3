function HConnector(hc) {

  hc.setInput('T1', (Tnum, value) => {
    if (value) hc.log('PLAY FILE 01')
  })

  hc.setInput('T2', (Tnum, value) => {
    if (value) hc.log('PLAY FILE 02')
  })

  hc.setInput('T3', (Tnum, value) => {
    if (value) hc.log('PLAY FILE 03')
  })

}

module.exports = HConnector
