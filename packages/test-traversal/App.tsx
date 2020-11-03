import React, { useState, useEffect } from 'react'
// axios is a commonjs package
import { merge } from 'lodash-es'
// import { merge as m } from 'lodash'
import Counter from './Counter'
import {SomeComponent} from 'some-react-components'

merge({}, {})
// m({}, {})

function App() {
    const [data, setData] = useState(null)

    return (
        <div>
            <p>Box2</p>
            <br />
            <br />
            <br />
            <Counter />
            <hr />
            <SomeComponent/>
            <p>Load data using axios:</p>
            {data ? (
                <pre>{JSON.stringify(data, null, 2)}</pre>
            ) : (
                <p>Loading data...</p>
            )}
        </div>
    )
}

export default App
