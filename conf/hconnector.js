module.exports = (gpio) => 
{

  gpio.setInput('T1')
  gpio.setInput('T2')
  gpio.setInput('T3')

  // gpio.setInput('T1', (pin, value) => {
  //   if (value) hc.log('PLAY FILE 01')
  // })

  // gpio.setInput('T2', (pin, value) => {
  //   if (value) hc.log('PLAY FILE 02')
  // })

  // gpio.setInput('T3', (pin, value) => {
  //   if (value) hc.log('PLAY FILE 03')
  // })

}