import React, { useState, useEffect } from 'react'
// axios is a commonjs package
import axios from 'axios'
import image from './image.png'
import s from './App.module.css'
import Counter from './Counter'
import { func } from 'package-b'
import { SomeComponent } from 'some-react-components'

function App() {
    const [data, setData] = useState(null)

    useEffect(() => {
        axios
            .get(
                'https://os.alipayobjects.com/rmsportal/ODDwqcDFTLAguOvWEolX.json',
            )
            .then((value) => {
                setData(value.data[0].children[0])
            })
    }, [])

    return (
        <div className={s.box}>
            <p>Box2</p>
            {image}
            <br />
            <br />
            <br />
            {JSON.stringify(func())}
            <SomeComponent />
            <Counter />
            <hr />
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
