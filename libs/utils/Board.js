const EMPTY = 0
const WALL = 85
const SNAKE = 170
const FOOD = 255

class Board {
  static factory (boardName, w, h) {
    switch (boardName) {
      case 'BORDERED': return Board.Bordered(w, h)
      case 'EMPTY': return Board.Empty(w, h)
      default:
        return Board.Empty(w, h)
    }
  }

  static Bordered (w, h) {
    let b = Board.Empty(w, h)
    for (var x = 0; x < w; x++) {
      b[x][0] = WALL
      b[x][h - 1] = WALL
    }

    for (var y = 1; y < h - 1; y++) {
      b[0][y] = WALL
      b[w - 1][y] = WALL
    }
    return b
  }

  static Empty (w, h) {
    let b = new Array(h).fill(EMPTY)
    for (var i = 0; i < b.length; i++) {
      b[i] = new Array(w).fill(EMPTY)
    }
    return b
  }

  static GetElementName (value) {
    switch (value) {
      case WALL: return 'WALL'
      case EMPTY: return 'EMPTY'
      case SNAKE: return 'SNAKE'
      case FOOD: return 'FOOD'
      default: return ''
    }
  }

  static get WALL () {
    return WALL
  }

  static get EMPTY () {
    return EMPTY
  }

  static get SNAKE () {
    return SNAKE
  }

  static get FOOD () {
    return FOOD
  }
}

module.exports = Board
