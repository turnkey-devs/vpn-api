
import { FileObject } from '../models/file_object'
import { HttpClientConfigProps as HttpClientConfigProperties } from '../models/http_client_config_props.interface'

export interface HTTPClientService {
	
  setOptions(configs: HttpClientConfigProperties): HttpClientConfigProperties;
  getOptions(): HttpClientConfigProperties;
	
  get(url: string, data?: any, configs?: HttpClientConfigProperties): Promise<any>;
  getFile(url: string, data?: any, configs?: HttpClientConfigProperties): Promise<FileObject | undefined>;
  post(url: string, data: any, configs?: HttpClientConfigProperties): Promise<any>;
  put(url: string, data: any, configs?: HttpClientConfigProperties): Promise<any>;
  delete(url: string, data: any, configs?: HttpClientConfigProperties): Promise<any>;
}
