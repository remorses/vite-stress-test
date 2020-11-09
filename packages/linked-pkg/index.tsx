import React from 'react'
import { merge } from 'smoldash/dist/esm/'

export const SomeComponent = ({}) => {
    return (
        <pre>
            {JSON.stringify(merge({ merge: true }, { SomeComponent: true }))}
        </pre>
    )
}
