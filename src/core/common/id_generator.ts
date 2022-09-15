import { nanoid, customAlphabet } from 'nanoid'
import { numbers } from 'nanoid-dictionary'

export const idGenerator = (length = 24) => nanoid(length)
export const idNumberGenerator = (length = 24) => customAlphabet(numbers, length)(length)
