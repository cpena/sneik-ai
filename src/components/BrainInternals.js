import React, { Component } from 'react'
import Plot from 'react-plotly.js'

const SCALE = 15

class BrainInternals extends Component {
  render () {
    const { data } = this.props
    let convs = []
    let table = []
    if (data) {
      convs = Object.keys(data.activationMaps)
      for (let i in data.Q_table) {
        table.push(data.Q_table[i])
      }
    }
    return (
      <div className='brain-internals'>
        {convs
          ? <div>
            {convs.map((n, i) => <div key={n}>
              <div>{n}</div>
              {data.activationMaps[n].map((map, i) => {
                let chart = this._prepareChart(map.map, map.shape)
                return <Plot
                  key={n + '-' + i}
                  data={chart.data}
                  layout={chart.layout}
                  config={chart.config} />
              })
              }
            </div>
            )}
          </div>
          : null
        }

        {table.length > 0
          ? <div className='q-table'>
            <div className='title'>Q TABLE</div>
            {table.map((value, i) => {
              // console.log(value)
              return <span key={'q-table' + i}>{value.toFixed(3)}</span>
            }
            )}
          </div>
          : null
        }
      </div>
    )
  }

  _prepareChart (actMap, shape) {
    let i = 0
    let z = new Array(shape[0])
    for (let x = 0; x < shape[0]; x++) {
      z[x] = new Array(shape[1])
      for (let y = 0; y < shape[1]; y++) {
        z[x][y] = actMap[i]
        i++
      }
    }

    let data = [{
      z,
      type: 'heatmap',
      colorscale: 'Greys',
      showlegend: false,
      showarrow: false,
      showscale: false,
      showgrid: false
    }]

    let layout = {
      autosize: false,
      width: shape[0] * SCALE,
      height: shape[1] * SCALE,
      margin: {
        l: 10,
        r: 10,
        b: 10,
        t: 10,
        pad: 4
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      showlegend: false,
      xaxis: { visible: false },
      yaxis: { visible: false }
    }

    let config = {
      displayModeBar: false
    }
    return { data, layout, config }
  }
}

export default BrainInternals
