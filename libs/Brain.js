const Settings = require('./Settings')
const tf = require('@tensorflow/tfjs')

const NUM_ACTIONS = 4

class Brain {
  constructor (memory) {
    this.generateActivations = true
    this.memory = memory
    this.inputShape = [Settings.BOARD_WIDTH, Settings.BOARD_HEIGHT, 1]
    this.epsilon = Settings.EPSILON
    this.Q_table = new Array(NUM_ACTIONS)
    this.activationMaps = {}
    this.states = []
  }

  load () {
    return tf.io.listModels()
      .then((list) => {
        let modelFilename = Settings.SAVE_MODEL_DESTINATION + Settings.MODEL_NAME
        console.log('Available models', list, modelFilename)
        if (Object.keys(list).indexOf(modelFilename) !== -1) {
          return this._loadModel()
        } else {
          return this._buildModel()
        }
      })
      .then(() => {
        if (Settings.TRAINING_INTERVAL > 0) {
          this.trainInterval = setInterval(() => {
            this._trainModel()
          }, Settings.TRAINING_INTERVAL)
        }
      })
  }

  stop () {
    if (this.trainInterval) {
      clearInterval(this.trainInterval)
    }
  }

  thinkAction (state) {
    // console.log(state)
    let prediction = { action: null, q: null }

    if (!state.willCrash) {
      prediction = this._runDeepQLearning(state)
    }
    return prediction
  }

  getStats () {
    return {
      Q_table: this.Q_table,
      activationMaps: this.activationMaps
    }
  }

  // Private methods
  async _loadModel () {
    console.log('Loading model')
    let modelName = Settings.MODEL_NAME
    this.model = await tf.loadModel(Settings.SAVE_MODEL_DESTINATION + modelName)
    this.model.compile({
      loss: 'meanSquaredError',
      optimizer: tf.train.sgd(Settings.LEARNING_RATE),
      metrics: ['accuracy']
    })

    this.model.summary()
  }

  _buildModel () {
    console.log('Building model')
    this.convLayers = []
    this.model = tf.sequential()

    this.model.add(tf.layers.conv2d({
      inputShape: this.inputShape,
      filters: 16,
      kernelSize: 5,
      strides: 2,
      padding: 'same',
      activation: 'relu',
      kernelInitializer: 'VarianceScaling' }))

    this.model.add(tf.layers.conv2d({
      filters: 32,
      kernelSize: 3,
      strides: 2,
      padding: 'same',
      activation: 'relu',
      kernelInitializer: 'VarianceScaling' }))

    this.model.add(tf.layers.flatten())

    this.model.add(tf.layers.dense({
      kernelInitializer: 'VarianceScaling',
      units: 256
    }))

    this.model.add(tf.layers.dense({
      units: NUM_ACTIONS,
      kernelInitializer: 'VarianceScaling'
    }))

    this.model.compile({
      loss: 'meanSquaredError',
      optimizer: tf.train.sgd(Settings.LEARNING_RATE),
      metrics: ['accuracy']
    })

    this.model.summary()
  }

  _saveModel () {
    console.log('Saving model')
    let modelName = Settings.MODEL_NAME
    this.model.save(Settings.SAVE_MODEL_DESTINATION + modelName) // ('localstorage://' + modelName)
      .then(() => {
        console.log('Saved model!')
      })
      .catch(console.error)
  }

  async _runDeepQLearning (state) {
    let prediction = { action: null, q: null }

    if (Math.random() <= this.epsilon) {
      // Random explore
      prediction.action = Math.floor(Math.random() * NUM_ACTIONS)
    } else {
      // Brain explore
      prediction = await this._makePrediction(state)
    }

    // Decay of random explore
    if (this.epsilon > Settings.FINAL_EPSILON) {
      this.epsilon = this.epsilon * Settings.EPSILON_DECAY
    } else {
      this.epsilon = Settings.FINAL_EPSILON
    }

    return prediction
  }

  async _makePrediction (state) {
    // Creating input vector
    let input = this._getTFInput(state.currentBoard)
    input = input.expandDims(0)
    // console.log(input.shape)

    if (this.generateActivations) {
      // Run model layer by layer to store activations
      this.Q_table = await this._predictWithActivations(input)
    } else {
      // Run model
      this.Q_table = await this.model.predict(input).data()
    }

    // Get action: index of max value in Q table
    let action = (await tf.argMax(this.Q_table).data())[0]
    // console.log('Q-table: ', this.Q_table, 'action: ', action)

    // cleanup memory
    input.dispose()
    return { action, q: this.Q_table }
  }

  async _trainModel () {
    console.log('Training')

    // get random batch of states
    let states = await this.memory.batch(Settings.BATCH_SIZE)
    if (states.length === 0) {
      console.warn('No enough data!')
      return
    }
    // console.log(states)

    // Prepare inputs and targets
    let inputs = []
    let targets = []
    for (let i in states) {
      let state = states[i]
      // Get input from bpard
      inputs.push(this._getTFInput(state.currentBoard))

      // Calc reward
      let reward = this._calcReward(state)

      // Calc total reward estimated
      let totalReward = 0
      if (state.willCrash) {
        totalReward = reward
      } else {
        let nextInput = this._getTFInput(state.nextBoard).expandDims(0)
        let nextQtable = await this.model.predict(nextInput).data()
        let maxNextReward = await tf.max(nextQtable).data()
        totalReward = reward + Settings.QLEARN_GAMMA * maxNextReward

        nextInput.dispose()
      }

      let target = Array.prototype.slice.call(state.q)
      target[state.lastAction] = totalReward
      // console.log(state.q, target, state.lastAction, totalReward)
      targets.push(tf.tensor1d(target))
    }
    inputs = tf.stack(inputs)
    targets = tf.stack(targets)

    // Train model
    this.model.fit(inputs, targets, {
      batchSize: states.length,
      epochs: 1,
      callbacks: {
        onBatchEnd: () => console.log('Training ended!')
      }
    })
      .then(() => {
        // Cleanup memory
        inputs.dispose()
        targets.dispose()

        // Save model
        if (Settings.SAVE_MODEL) {
          this._saveModel()
        }
      })
      .catch(console.error)
  }

  async _predictWithActivations (input) {
    let inputs = []
    inputs.push(input)
    for (var i = 0; i < this.model.layers.length; i++) {
      inputs.push(this.model.layers[i].apply(inputs[i]))

      // Get activations in conv2D layers
      if (this.model.layers[i].name.indexOf('conv2d') !== -1) {
        const shape = inputs[i + 1].shape
        const convList = tf.unstack(inputs[i + 1].reshape([shape[1], shape[2], shape[3]]), 2)
        this.activationMaps[this.model.layers[i].name] = []
        for (let j in convList) {
          this.activationMaps[this.model.layers[i].name].push({ map: convList[j].dataSync(), shape: convList[j].shape })
          convList[j].dispose()
        }
      }
    }
    let q = await inputs[inputs.length - 1].data()

    for (let i = inputs.length - 1; i >= 0; i--) {
      inputs[i].dispose()
    }
    return q
  }

  _calcReward (state) {
    let reward = Settings.QLEARN_REWARD_ALIVE
    if (Settings.QLEARN_NEARNESS_REWARD) {
      if (state.snakePos && state.foodPos) {
        let newDistance = this._getDistanceToFood(state.snakePos, state.foodPos)
        if (this.oldDistance) {
          if (newDistance < this.oldDistance) {
            reward = Settings.QLEARN_REWARD_CLOSE
          } else {
            reward = Settings.QLEARN_REWARD_FAR
          }
        }
        this.oldDistance = newDistance
      }
    }
    if (state.willCrash) {
      reward = Settings.QLEARN_REWARD_DIE
    } else if (state.willEat) {
      reward = Settings.QLEARN_REWARD_EAT
    }
    return reward
  }

  _getDistanceToFood (snake, food) {
    let x = Math.pow((snake[0] - food[0]), 2)
    let y = Math.pow((snake[1] - food[1]), 2)
    return Math.sqrt(x + y)
  }

  _getTFInput (board) {
    return tf.tensor2d(board).div(255.0).expandDims(2)
  }
}

module.exports = Brain
