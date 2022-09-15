export interface HttpClientConfigProps {
  data?: any;
  encoding?: 'utf8' | 'base64';
  headers?: any;
  isJson?: boolean;
  url?: string;
  port?: number;
  timeout?: number;
  ssl?: boolean;
  method?:
  | 'POST'
  | 'GET'
  | 'PUT'
  | 'DELETE';
  responseType?:
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text'
  | 'stream';
}
