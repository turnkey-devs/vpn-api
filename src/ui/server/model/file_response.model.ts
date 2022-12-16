import type { Buffer } from 'buffer'

export class FileResponseData {
  constructor(
    public filename: string,
    public content: Buffer | ArrayBuffer | string | number | Record<string, any>,
    public mimeType?: string,
  ) {}
}
