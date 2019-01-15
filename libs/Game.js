const Settings = require('./Settings')
const Board = require('./utils/Board')

const ACTIONS = [[0, 1], [0, -1], [-1, 0], [1, 0]]

const TURBO_REFRESH = 1
const NORMAL_REFRESH = 300
const BATCH_STATS = 10

class Game {
  constructor (onStateChange, onDisplayChange) {
    this.timer = null
    this.games = 0
    this.highScore = 0
    this.gameStats = (new Array(BATCH_STATS)).fill({ score: 0, framesAlive: 0, games: 0 })
    this.gameStatsIndex = 0
    this.onStateChange = onStateChange
    this.onDisplayChange = onDisplayChange
  }

  start () {
    this.board = Board.factory(Settings.BOARD, Settings.BOARD_WIDTH, Settings.BOARD_HEIGHT)
    this.snake = this._initSnake(this.board)
    this.food = this._moveFood(this.board, this.snake)
    this.games = this.games + 1
    this.score = 0
    this.framesAlive = 0

    this._updateDisplay()
    this._fireStateChange(null, this.board, this.snake, null, this.food, null, false, false)
  }

  stop () {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  applyAction (action) {
    if (this._checkAction(action)) {
      let newPos = this._calcNewSnakePosition(this.snake, ACTIONS[action])
      let willCrash = this._checkIfWillCrash(newPos, this.board, this.snake)
      let willEat = this._checkIfWillEatFood(newPos, this.food)
      let oldSnake = this._clone2DArray(this.snake)
      let oldFood = this.food.slice()

      this.snake = this._updateSnake(newPos, this.snake, willEat)
      if (willCrash) {
        this._saveGameStats()
      } else {
        if (willEat) {
          this.food = this._moveFood(this.board, this.snake)
          this.score++
          this.highScore = Math.max(this.score, this.highScore)
        }
        this.framesAlive++
      }

      this._updateDisplay()
        .then(() => {
          return this._fireStateChange(action, this.board, oldSnake, this.snake, oldFood, this.food, willCrash, willEat)
        })
        .then(() => {
          if (willCrash) {
            this.start()
          }
        })
    }
  }

  setSettings (settings) {
    this.settings = settings
  }

  getGameStats () {
    let len = this.gameStats.length
    let acum = this.gameStats.reduce((old, cur) => {
      return {
        score: old.score + cur.score,
        framesAlive: old.framesAlive + cur.framesAlive
      }
    })
    return {
      score: acum.score / len,
      framesAlive: acum.framesAlive / len,
      games: this.games,
      highScore: this.highScore }
  }

  // Private methods
  _initSnake (board) {
    let snake = []
    if (board) {
      while (true) {
        let i
        let x = this._rand(Settings.SNAKE_INITIAL_LENGTH + 1, Settings.BOARD_WIDTH - Settings.SNAKE_INITIAL_LENGTH - 1)
        let y = this._rand(Settings.SNAKE_INITIAL_LENGTH + 1, Settings.BOARD_HEIGHT - Settings.SNAKE_INITIAL_LENGTH - 1)
        let dx = Math.random() > 0.5
        snake = []
        for (i = 0; i < Settings.SNAKE_INITIAL_LENGTH; i++) {
          if (board[x][y] === Board.EMPTY) {
            snake.push([x, y])
            if (dx) {
              x -= 1
            } else {
              y -= 1
            }
          } else {
            break
          }
        }
        if (i === Settings.SNAKE_INITIAL_LENGTH) {
          break
        }
      }
    }
    return snake
  }

  _moveFood (board, snake) {
    let food = []
    if (board && snake) {
      let serializedSnake = snake.map(p => p[0] + 'x' + p[1])
      while (true) {
        let x = this._rand(Settings.SNAKE_INITIAL_LENGTH + 1, Settings.BOARD_WIDTH - Settings.SNAKE_INITIAL_LENGTH - 1)
        let y = this._rand(Settings.SNAKE_INITIAL_LENGTH + 1, Settings.BOARD_HEIGHT - Settings.SNAKE_INITIAL_LENGTH - 1)
        if (board[x][y] === Board.EMPTY && serializedSnake.indexOf(x + 'x' + y) === -1) {
          food = [x, y]
          break
        }
      }
    }
    return food
  }

  _calcNewSnakePosition (snake, action) {
    // Calc new position
    let x = snake[0][0] + action[0]
    let y = snake[0][1] + action[1]

    // Check boundaries
    if (x < 0) {
      x = Settings.BOARD_WIDTH - 1
    } else if (x === Settings.BOARD_WIDTH) {
      x = 0
    }

    if (y < 0) {
      y = Settings.BOARD_HEIGHT - 1
    } else if (y === Settings.BOARD_HEIGHT) {
      y = 0
    }
    return [x, y]
  }

  _checkIfWillEatFood (pos, food) {
    return (food[0] === pos[0] && food[1] === pos[1])
  }

  _checkIfWillCrash (pos, board, snake) {
    let crash = board[pos[0]][pos[1]] === Board.WALL
    if (!crash) {
      let serializedSnake = this.snake.map(p => p[0] + 'x' + p[1])
      crash = serializedSnake.indexOf(pos[0] + 'x' + pos[1]) !== -1
    }
    return crash
  }

  _updateSnake (pos, snake, grow) {
    const newSnake = []
    newSnake[0] = [pos[0], pos[1]]
    if (grow) {
      Array.prototype.push.apply(newSnake, snake)
    } else {
      Array.prototype.push.apply(newSnake,
        snake.slice(1).map((s, i) => {
          return snake[i]
        })
      )
    }
    return newSnake
  }

  _fireStateChange (lastAction, board, oldSnake, newSnake, oldFood, newFood, willCrash, willEat) {
    return new Promise((resolve, reject) => {
      // console.log(lastAction, board, oldSnake, newSnake, oldFood, newFood, willCrash, willEat)
      // Pack state to brain
      let state = {
        lastAction,
        currentBoard: this._generateStateImage(board, oldSnake, oldFood),
        nextBoard: this._generateStateImage(board, newSnake, newFood),
        willCrash,
        willEat,
        snakePos: newSnake ? newSnake[0] : null,
        foodPos: newFood
      }

      this.timer = setTimeout(() => {
        this.onStateChange(state)
        resolve()
      }, this.settings.turbo ? TURBO_REFRESH : NORMAL_REFRESH)
    })
  }

  _generateStateImage (board, snake, food) {
    if (snake) {
      let stateImage = this._clone2DArray(board)
      for (let i in snake) {
        let x = snake[i][0]
        let y = snake[i][1]
        stateImage[x][y] = Board.SNAKE
      }
      if (food) {
        let x = food[0]
        let y = food[1]
        stateImage[x][y] = Board.FOOD
      }
      return stateImage
    }
    return null
  }

  _updateDisplay () {
    return new Promise((resolve, reject) => {
      if (this.onDisplayChange) {
        this.onDisplayChange({
          board: this.board,
          snake: this.snake,
          food: this.food,
          games: this.games,
          score: this.score,
          highScore: this.highScore
        })
      }
      resolve()
    })
  }

  _saveGameStats () {
    if (this.gameStatsIndex >= BATCH_STATS) {
      this.gameStatsIndex = 0
    }

    this.gameStats[this.gameStatsIndex] = {
      score: this.score,
      framesAlive: this.framesAlive
    }
    this.gameStatsIndex++
  }

  _checkAction (action) {
    return typeof ACTIONS[action] !== 'undefined'
  }

  _rand (init, end) {
    return Math.floor(Math.random() * end) + init
  }

  _clone2DArray (array) {
    return array.map((arr) => {
      return arr.slice()
    })
  }
}
module.exports = Game
