import { modelFactory } from "@server/core/common/model_factory"

export class SuccessResponseData {
  constructor(
    public code?: number,
    public httpStatus?: number,
    public status?: string,
    public message?: string,
    public data?: any,
  ) {
    if (!code) 
      this.code = 0

    if (!message) 
      this.message = `success`

    if (!status) 
      this.status = `SUCCESS`

    if (!httpStatus) 
      this.httpStatus = 200
  }
  
  static factory = modelFactory(SuccessResponseData)
}

export const successResponse = SuccessResponseData.factory
