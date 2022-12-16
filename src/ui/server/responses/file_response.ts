import type { Response } from 'express'
import type { FileResponseData } from '../model/file_response.model'

export const fileResponse = (response_: Response, file: FileResponseData) => {
  file.filename ? response_.attachment(file.filename) : void 0
  response_.setHeader(`Content-Type`, file?.mimeType ?? `application/octet-stream`)
  response_.status(200)
  return response_.end(file?.content, `binary`)
}
