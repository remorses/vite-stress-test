import React from 'react'
console.log('react', React)
import ReactDOM from 'react-dom'
import App from './App'
import {default as App2} from './App'
console.log({ok: App2 === App})

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root'),
)

// @ts-ignore
if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        console.log('updated')
    })
}
