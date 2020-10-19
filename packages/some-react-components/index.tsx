import React from 'react'

export function SomeComponent({}) {
    return (
        <div>
            <pre>
                {JSON.stringify({
                    someData: [1, 2, 3, 4, 6],
                })}
            </pre>
        </div>
    )
}
