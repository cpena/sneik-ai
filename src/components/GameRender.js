import React, { Component } from 'react'
import Board from '../libs/utils/Board'

class GameRender extends Component {
  render () {
    const { board, snake, food, games, score, highScore } = this.props
    return (
      <div className='game'>
        <div className='title'>
          SNEIK AI
        </div>
        <div className='scores'>
          <div className='info'>
            <div>GAMES</div>
            <div>{this._pad(games, 5)}</div>
          </div>
          <div className='info'>
            <div>HI-SCORE</div>
            <div>{this._pad(highScore, 5)}</div>
          </div>
          <div className='info'>
            <div>SCORE</div>
            <div>{this._pad(score, 5)}</div>
          </div>
        </div>
        <div className='grid'>
          {board
            ? board.map((row, y) => {
              return (
                <div key={y} className='grid-col'>
                  {row.map((v, x) => {
                    let c = this._getCellClassName(x, y, v, snake, food)
                    return <div className={'grid-cell ' + c} key={x + 'x' + y} />
                  })
                  }
                </div>
              )
            })
            : null
          }
        </div>
      </div>
    )
  }

  _getCellClassName (x, y, value, snake, food) {
    let snakeSerialized = snake.map(p => p[0] + 'x' + p[1])
    if (food[0] === x && food[1] === y) {
      return 'grid-cell-food'
    } else if (snakeSerialized.indexOf(x + 'x' + y) !== -1) {
      return 'grid-cell-snake'
    } else if (value === Board.WALL) {
      return 'grid-cell-wall'
    }
    return ''
  }

  _pad (text, size) {
    let s = String(text)
    while (s.length < (size || 2)) {
      s = '0' + s
    }
    return s
  }
}

export default GameRender
