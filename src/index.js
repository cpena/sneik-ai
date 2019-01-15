import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'

/* Add firebase config
import firebase from 'firebase/app'
import 'firebase/firestore'

const config = {
}

firebase.initializeApp(config)
firebase.firestore().settings({ timestampsInSnapshots: true })
*/

ReactDOM.render(<App />, document.getElementById('root'))
