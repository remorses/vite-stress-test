import { concat } from 'lodash-es'

export default function () {
    return concat([1], [2]) as any
}
export function func() {
    return concat([90], [2])
}
