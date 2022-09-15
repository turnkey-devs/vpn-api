export class HttpClientError extends Error {
	name='HTTP_CLIENT_ERROR'
  constructor(
    public message: string,
    public debug?: Record<string, any>,
  ) {
    super(message)
  }
}