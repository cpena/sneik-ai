const Brain = require('../libs/Brain')
const Memory = require('../libs/Memory')
const Game = require('../libs/Game')

require('@tensorflow/tfjs-node')
const GAME_STATS_INTERVAL = 10000

class Sneik {
  constructor () {
    this.brain = null
    this.settings = {
      turbo: true,
      showBrainInternals: false,
      showStats: false
    }
  }

  startGame () {
    console.log('Loading memory')
    this.memory = new Memory()
    this.memory.load()
      .then(() => {
        console.log('Loading brain')
        this.brain = new Brain(this.memory)
        return this.brain.load()
      })
      .then(() => {
        console.log('Starting game')
        this.game = new Game(this.onGameStateChange.bind(this), null)
        this.game.setSettings(this.settings)
        this.game.start()

        this._updateStats()
        this.statsInterval = setInterval(() => {
          this._updateStats()
        }, GAME_STATS_INTERVAL)
      })
      .catch(console.error)
  }

  stopGame () {
    console.log('Stopping game')
    this.game.stop()
    this.memory.stop()
    this.brain.stop()
  }

  async onGameStateChange (state) {
    let prediction = await this.brain.thinkAction(state)
    // console.log('prediction', prediction)
    let { action, q } = prediction
    if (action !== null) {
      this.game.applyAction(action)
    }
    state.q = q
    this.memory.save(state)
  }

  _updateStats () {
    console.log(this.game.getGameStats())
  }
}

const sneik = new Sneik()

process.on('SIGINT', () => {
  sneik.stopGame()
  process.exit()
})
sneik.startGame()
