import React, { Component } from 'react'

class GameSettings extends Component {
  constructor (props) {
    super(props)
    this.state = {
      settings: props.settings
    }
    this.onSettingsChange = props.onSettingsChange
    this.toggleChange = this.toggleChange.bind(this)
  }

  toggleChange (event) {
    let { settings } = this.state
    settings[event.target.name] = event.target.checked
    this.onSettingsChange(settings)
  }

  render () {
    const { settings } = this.state
    return (
      <div className='game-settings'>
        <div className='title'>SETTINGS</div>

        <div className='game-setting'>
          <div className='setting-name'>SPEED</div>
          <label htmlFor='turbo' className='button-toggle'>
            <input className='input' type='checkbox' id='turbo' name='turbo' defaultChecked={settings.turbo} onChange={this.toggleChange} />
            <div className='wrapper'>
              <span className='text' >
                <span className='off'>NORMAL</span>
                <span className='on'>TURBO</span>
              </span>
            </div>
          </label>
        </div>

        <div className='game-setting'>
          <div className='setting-name'>GAME STATS</div>
          <label htmlFor='showStats' className='button-toggle'>
            <input className='input' type='checkbox' id='showStats' name='showStats' defaultChecked={settings.showStats} onChange={this.toggleChange} />
            <div className='wrapper'>
              <span className='text' >
                <span className='off'>OFF</span>
                <span className='on'>ON</span>
              </span>
            </div>
          </label>
        </div>

        <div className='game-setting'>
          <div className='setting-name'>BRAIN INTERNALS</div>
          <label htmlFor='showBrainInternals' className='button-toggle'>
            <input className='input' type='checkbox' id='showBrainInternals' name='showBrainInternals' defaultChecked={settings.showBrainInternals} onChange={this.toggleChange} />
            <div className='wrapper'>
              <span className='text' >
                <span className='off'>OFF</span>
                <span className='on'>ON</span>
              </span>
            </div>
          </label>
        </div>

      </div>
    )
  }
}

export default GameSettings
