import 'reflect-metadata'
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import qs from 'qs'
import { HttpClientConfigProps as HttpClientConfigProperties } from '../models/http_client_config_props.interface'
import { HttpClientError } from '../common/errors/http_client_error.class'
import { isEmpty } from '../common/is_empty'
import { dataSize } from '../common/data_size'
import { FileObject } from '../models/file_object'
import { DeepObjectMerge } from '../common/deep_object_merge'
import { HTTPClientService } from './http_client_service.interface'
import { omitUndefinedProperty } from '@turnkeyid/utils-ts'
import { mainLogger } from '@server/core/logger/pretty_logger'

const DEFAULT_OPTIONS: HttpClientConfigProperties = {
  timeout: 60 * 1000,
  ssl: false,
}

export class AxiosHttpClientService implements HTTPClientService {
  private readonly _client: AxiosInstance
  private _options: HttpClientConfigProperties = DEFAULT_OPTIONS

  private readonly _logger = mainLogger
	
  constructor() {
    this._client = Axios.create()
  }
	
  public setOptions(options: HttpClientConfigProperties) {
    this._options = DeepObjectMerge(this._options, options)
    return this._options
  }
  
  public getOptions(): HttpClientConfigProperties {
    return this._options
  }
	
  private _getHttpClientConfigs(configs?: HttpClientConfigProperties): AxiosRequestConfig {
    const mergedConfigs = DeepObjectMerge(
      this._options,
      configs ?? {},
    ) || this._options
    
    const clientConfigs = omitUndefinedProperty<AxiosRequestConfig>({
      baseURL: mergedConfigs.url,
      timeout: mergedConfigs.timeout,
      data: mergedConfigs.data,
      headers: mergedConfigs.headers,
      method: mergedConfigs.method,
      responseType: mergedConfigs.responseType ?? `json`,
      // HttpsAgent: !mergedConfigs.ssl ? new https.Agent({
      // 	rejectUnauthorized: false,
      // }) : undefined,
    })  
    if (!clientConfigs)
      throw new HttpClientError(`config undefined`)
    return clientConfigs
  }

  public get = async (
    url: string,
    data?: any,
    configs?: HttpClientConfigProperties,
  ): Promise<any> => {
    try {
      this._logger(`get`, { url, data, configs }, `DEBUG`)
			
      const queryString = data && !isEmpty(data)
        ? `?${ qs.stringify(data) }`
        : ``
      
      const clientConfigs = this._getHttpClientConfigs(configs)
      
      const response = await this._client?.get(`${ url + queryString }`, clientConfigs)
        .then(response_ => response_.data)
        .catch(error => {
          const respData = error?.response?.data
          if (error?.code === `ECONNABORTED`) {
            throw new HttpClientError(
              `Request Timeout ${ error?.config?.timeout }ms`, {
                respData,
                error,
              },
            )
          }

          throw new HttpClientError(`request ${ url } refused!`, {
            error, clientConfigs,	respData,
          })
        })
      return response
    } catch (error) {
      const clientConfigs = this._getHttpClientConfigs(configs)
      this._logger(`get`, { error, data, clientConfigs, configs }, `ERROR`)
      throw error			
    }
  }
	
  private readonly _fileObjectMapper = (response: AxiosResponse, path: string) => {
    const { data } = response
    const contentDisposition = (response?.data?.headers?.[`content-disposition`])
      ?? (response.headers?.[`content-disposition`])
    const filename = (contentDisposition?.split(`filename=`))?.[1] ?? `downloaded_file.unknown`
    const filetype = response.headers[`content-type`]
    const size = dataSize(data)
				
    return new FileObject(
      data,
      filename.replace(/"/g, ``),
      size,
      filetype,
      path,
      path,
    )
  }
	
  public getFile = async (
    url: string,
    data?: any,
    configs: HttpClientConfigProperties = { responseType: `arraybuffer` },
  ): Promise<FileObject | undefined> => {
    try {
      this._logger(`getFile`, { url, data, configs }, `DEBUG`)
			
      const queryString = !isEmpty(data)
        ? `?${ qs.stringify(data) }`
        : ``
			
      const clientConfigs = this._getHttpClientConfigs({
        ...configs,
      })
      const response = await this._client?.get(`${ url + queryString }`, clientConfigs)
        .catch(error => {
          const respData = error?.response?.data
          if (error?.code === `ECONNABORTED`) {
            throw new HttpClientError(
              `Request Timeout ${ error?.config?.timeout }ms`,
              error,
            )
          }

          throw new HttpClientError(`request ${ url } refused!`, {
            error, clientConfigs,	respData,
          })
        })
			
      if (response) 
        return this._fileObjectMapper(response, url + `${ queryString }`)
    } catch (error) {
      const clientConfigs = this._getHttpClientConfigs(configs)
      this._logger(`getFile`, { error, data, configs, clientConfigs }, `ERROR`)
      throw error			
    }
  }

  public post = async (
    url: string,
    data: any,
    configs?: HttpClientConfigProperties,
  ): Promise<any> => {
    try {
      this._logger(`post`, { url, data, configs }, `DEBUG`)
			
      const clientConfigs = this._getHttpClientConfigs(configs)
      const response = await this._client.post(url, data, clientConfigs)
        .catch(error => {
          const respData = error?.response?.data
          if (error?.code === `ECONNABORTED`) {
            throw new HttpClientError(
              `Request Timeout ${ error?.config?.timeout }ms`,
              error,
            )
          }

          throw new HttpClientError(`request ${ url } refused!`, {
            error, clientConfigs,	respData,
          })
        })
      return response.data
    } catch (error) {
      const clientConfigs = this._getHttpClientConfigs(configs)
      this._logger(`get`, { error, data, configs, clientConfigs }, `ERROR`)
      throw error
    }
  }

  public put = async (
    url: string,
    data: any,
    configs?: HttpClientConfigProperties,
  ): Promise<any> => {
    // Const response = await this._client.put(url, data, configs)
    // return response.data
  }

  public delete = async (
    url: string,
    data: any,
    configs?: HttpClientConfigProperties,
  ): Promise<any> => {
    // Const queryString = qs.stringify(data)
    // const response = await this._client.delete(
    // 	url + `?${queryString}`,
    // 	configs,
    // )
    // return response.data
  }
}
