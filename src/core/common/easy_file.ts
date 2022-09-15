import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { Buffer } from 'buffer'
import path from 'path'

const defaultOptions = {
  raw: false,
  encoding: `utf-8` as BufferEncoding,
  throwIfNotExists: true,
}

const stringifyInvalidObject = (unknownItem: unknown) => {
  if (typeof unknownItem === `string` || typeof unknownItem === `number`) 
    return String(unknownItem)

  if (typeof unknownItem === `object`) 
    return JSON.stringify(unknownItem)

  if (unknownItem instanceof Buffer) 
    return unknownItem
}

export const easyWriteFile = <T>(
  filepath: string,
  content: T,
  opt?: Partial<typeof defaultOptions>,
) => {
  const { raw, encoding } = Object.assign({ ...defaultOptions }, opt)
  const dirname = path.dirname(filepath)
  mkdirSync(dirname, { recursive: true })
  writeFileSync(
    filepath,
    raw ? (stringifyInvalidObject(content) ?? ``) : JSON.stringify(content),
    { encoding },
  )
}

/**
 *  
 * @param filepath 
 * @param opt 
 * @default opt: {
 *  raw: false,
 *  encoding: 'utf8',
 *  throwIfNotExists: true,
 * }
 * @returns 
 */
export const easyReadFile = <R>(
  filepath: string,
  opt?: Partial<typeof defaultOptions>,
): R | undefined => {
  const { raw, encoding, throwIfNotExists } = Object.assign({ ...defaultOptions }, opt)
  try {
    const dirname = path.dirname(filepath)
    mkdirSync(dirname, { recursive: true })
    const content = readFileSync(
      filepath,
      { encoding },
    )
    return !raw ? JSON.parse(content) : content
  } catch (error) {
    if (throwIfNotExists) 
      throw error
    else 
      return void 0
  }
}

export const easyExistPath = (filepath: string) => {
  try {
    return existsSync(filepath)
  } catch {
    return false
  }
}

export const easyMakeDirectory = (targetPath: string, isDirectoryPath = false) => {
  const dirname = !isDirectoryPath ? path.dirname(targetPath) : targetPath
  mkdirSync(dirname, { recursive: true })
}
