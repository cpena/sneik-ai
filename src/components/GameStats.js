import React, { Component } from 'react'
import Plot from 'react-plotly.js'

class GameStats extends Component {
  render () {
    let stats = this.props.stats || []
    let chart = this._prepareChart(stats)

    return (
      <div className='game-stats'>
        <Plot data={chart.data} layout={chart.layout} config={chart.config} />
      </div>
    )
  }

  _prepareChart (stats) {
    let scores = {
      x: [],
      y: [],
      type: 'bar',
      name: 'Score'
    }
    let framesAlive = {
      x: [],
      y: [],
      type: 'bar',
      name: 'Frames alive',
      marker: {
        color: 'rgb(204,204,204)'
      }
    }

    for (let i in stats) {
      scores.x.push(i)
      scores.y.push(stats[i].score)
      framesAlive.x.push(i)
      framesAlive.y.push(stats[i].framesAlive)
    }

    let data = [framesAlive, scores]
    let layout = {
      barmode: 'group',
      rangemode: 'nonnegative',
      margin: { l: 20, r: 5, t: 5, b: 25 },
      height: 200,
      width: 300,
      legend: { orientation: 'h', yanchor: 'top' },
      xaxis: { visible: false }
    }
    let config = {
      displayModeBar: false
    }
    return { data, layout, config }
  }
}

export default GameStats
