import { SomeComponent } from './packages/some-react-components'
import React from 'react'
import ReactDOM from 'react-dom'

ReactDOM.render(
    <React.StrictMode>
        <SomeComponent />
    </React.StrictMode>,
    document.getElementById('root'),
)
