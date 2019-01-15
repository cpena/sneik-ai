import React, { Component } from 'react'
import Brain from './libs/Brain'
import Memory from './libs/Memory'
import Game from './libs/Game'
import Loading from './components/Loading'
import GameRender from './components/GameRender'
import GameSettings from './components/GameSettings'
import GameStats from './components/GameStats'
import BrainInternals from './components/BrainInternals'

const GAME_STATS_INTERVAL = 10000
const GAME_MAX_STATS = 100

class App extends Component {
  constructor (props) {
    super(props)
    this.game = React.createRef()
    this.state = {
      loading: true,
      game: {
        board: null,
        snake: null,
        food: null,
        games: 0,
        score: 0,
        highScore: 0
      },
      settings: {
        turbo: false,
        showBrainInternals: false,
        showStats: false
      },
      gameStats: []
    }
    this.onGameStateChange = this.onGameStateChange.bind(this)
    this.onGameDisplayChange = this.onGameDisplayChange.bind(this)
    this.onGameSettingsChange = this.onGameSettingsChange.bind(this)
  }

  componentDidMount () {
    this._startGame()
  }

  componentWillUnmount () {
    this._stopGame()
  }

  async onGameStateChange (state) {
    let { showBrainInternals } = this.state.settings

    let prediction = await this.brain.thinkAction(state)
    // console.log('prediction', prediction)
    let { action, q } = prediction
    if (action !== null) {
      this.game.applyAction(action)
    }
    state.q = q
    this.memory.save(state)

    if (showBrainInternals) {
      let brainInternals = await this.brain.getStats()
      this.setState({ brainInternals })
    }
  }

  onGameDisplayChange (data) {
    this.setState({ game: data })
  }

  onGameSettingsChange (settings) {
    this.game.setSettings(settings)
  }

  render () {
    const { loading, game, settings, gameStats, brainInternals } = this.state
    const { board, snake, food, games, score, highScore } = game

    return (
      <div>
        {loading
          ? <Loading />
          : <div>
            <div className={'game-container' + (settings.showBrainInternals ? ' inline' : '')}>
              <GameRender
                games={games}
                score={score}
                highScore={highScore}
                board={board}
                snake={snake}
                food={food} />
              <GameSettings
                settings={settings}
                onSettingsChange={this.onGameSettingsChange} />
              {settings.showStats
                ? <GameStats
                  stats={gameStats} />
                : null
              }
            </div>
            {settings.showBrainInternals
              ? <BrainInternals
                data={brainInternals} />
              : null
            }
          </div>
        }
      </div>
    )
  }

  _startGame () {
    console.log('Loading memory')
    this.memory = new Memory()
    this.memory.load()
      .then(() => {
        console.log('Loading brain')
        this.brain = new Brain(this.memory)
        return this.brain.load()
      })
      .then(() => {
        this.setState({ loading: false }, _ => {
          console.log('Starting game')
          this.game = new Game(this.onGameStateChange, this.onGameDisplayChange)
          this.game.setSettings(this.state.settings)
          this.game.start()

          this._updateStats()
          this.statsInterval = setInterval(() => {
            this._updateStats()
          }, GAME_STATS_INTERVAL)
        })
      })
      .catch(console.error)
  }

  _stopGame () {
    this.game.stop()
    this.memory.stop()
    this.brain.stop()
    clearInterval(this.statsInterval)
  }

  _updateStats () {
    let statsList = this.state.gameStats
    let newStats = this.game.getGameStats()

    if (statsList.length === GAME_MAX_STATS) {
      statsList = statsList.slice(1).push(newStats)
    } else {
      statsList.push(newStats)
    }
    this.setState({ gameStats: statsList })
  }
}

export default App
