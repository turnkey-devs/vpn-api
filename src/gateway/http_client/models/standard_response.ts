import { modelFactory } from "@server/core/common/model_factory"

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
