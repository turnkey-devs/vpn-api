import { modelFactory } from "@turnkeyid/utils-ts";

export class StandardAPIResponse {
  constructor(
    public code: number,
    public data: any,
    public httpStatus: number,
    public message: string,
    public status: string,
    public error?: any,
  ) {}
  
  static factory = modelFactory(StandardAPIResponse)
}
