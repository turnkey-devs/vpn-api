import { existsSync } from "fs"
import path from "path"
import { nonNullValue } from "./common_utils"
import { getDateInt, getFormattedDate } from "./date_helper"
import { easyReadFile, easyWriteFile } from "./easy_file"
import { safeJsonStringify } from "./safe_json_parse"

export const debugLogSync = (
  fileRequest?: {
    fileTitle?: string;
    filePath?: string;
  },
  object?: any,
  storageDirectory = path.resolve(
    nonNullValue(process.env.STORAGE_PATH, true),
    `debug_logs`,
  ),
) => {
  let { fileTitle, filePath } = fileRequest ?? {}
  fileTitle = fileTitle ?? `debug_log`
  fileTitle = `${ fileTitle }_${ getDateInt(Date.now()) }.log`
  
  filePath = filePath
    ? path.resolve(storageDirectory, filePath ?? ``)
    : path.resolve(storageDirectory, fileTitle)
  const objectString = safeJsonStringify(object)
  let existingFileContent: string | undefined = ``
  if (existsSync(filePath)) 
    existingFileContent = easyReadFile(filePath, { raw: true })

  const newFileContent = `${ existingFileContent }
    \n ====== [${ getFormattedDate(Date.now()) }] ====== \n
    ${ objectString }
    \n ============================================ \n
  `
  
  easyWriteFile(filePath, newFileContent, { raw: true })
}

export const debugLog = async (
  fileRequest?: {
    fileTitle?: string;
    filePath?: string;
  },
  object: any = {},
  storageDirectory = path.resolve(
    nonNullValue(process.env.STORAGE_PATH, true),
    `debug_logs`,
  ),
) => {
  debugLogSync(fileRequest, object, storageDirectory) 
}
