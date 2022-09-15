import { CreateConnectionRequest } from "./models/create_connection_request"

export interface DBClientPort<C=any> {
  createConnection(request: CreateConnectionRequest): Promise<C>;
}
