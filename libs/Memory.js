const Settings = require('./Settings')
const Board = require('./utils/Board')
const Hash = require('object-hash')

if (Settings.SAVE_STATES) {
  var firebase = require('firebase/app')
  require('firebase/firestore')
}

const SAVE_DELAY = 20000
const MAX_SAVE_BATCH = 100

class Memory {
  constructor () {
    this.states = []
    this.pendingStates = []
    this.saveTimer = null

    if (Settings.SAVE_STATES) {
      this.db = firebase.firestore()
    }
  }
  load () {
    return Promise.resolve()
  }
  stop () {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    if (this.pendingStates.length > 0) {
      this._batchSave()
    }
  }

  async batch (size) {
    let batch = []
    // console.log(this.states.length)
    if (this.states.length >= size) {
      for (let i = 0; i < size; i++) {
        let index = this.states.length * Math.random() << 0
        let s = this.states[index]
        batch.push(s)
        this.states.splice(index, 1)
      }
    }
    return batch
  }

  save (state) {
    // console.log(state)
    if (state.nextBoard !== null && state.q !== null) { // Avoid first frame and random states
      this.states.push(state)

      if (Settings.SAVE_STATES) {
        let packedState = this._packState(state)
        packedState.id = Hash(packedState)
        this.pendingStates.push(packedState)

        if (!this.saveTimer) {
          this.saveTimer = setTimeout(() => {
            this.saveTimer = null
            this._saveRemoteBatch()
          }, SAVE_DELAY)
        }
      }
    }
  }

  _saveRemoteBatch () {
    let len = this.pendingStates.length
    if (len > 0) {
      len = Math.min(len, MAX_SAVE_BATCH)
      console.log('Saving ' + len + ' pending states')

      let doc = Settings.MODEL_NAME
      let batch = this.db.batch()
      let ref = this.db.collection('State').doc(doc).collection('Samples')

      for (let i = 0; i < len; i++) {
        let s = this.pendingStates[i]
        batch.set(ref.doc(s.id), s)
      }
      batch.commit()
        .then(() => {
          this.pendingStates = this.pendingStates.slice(len)
          console.log('States saved!')
        })
        .catch(console.error)
    }
  }

  _packState (state) {
    return {
      crash: state.willCrash,
      eat: state.willEat,
      board: this._packBoard(state.currentBoard),
      nextBoard: this._packBoard(state.nextBoard)
    }
  }

  _packBoard (board) {
    let packedBoard = {}
    for (let x in board) {
      for (let y in board[x]) {
        let val = board[x][y]
        if (val !== Board.EMPTY) {
          let name = Board.GetElementName(val)
          if (!(name in packedBoard)) {
            packedBoard[name] = []
          }
          packedBoard[name].push({ x, y })
        }
      }
    }
    return packedBoard
  }

  _unpackBoard (packedBoard) {
  }
}

module.exports = Memory
