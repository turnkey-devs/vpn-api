import { modelFactory } from "@turnkeyid/utils-ts";

export class DatabaseConfig {
  constructor(
    public id: string,
    public authMethod: string,
    public password: string,
    public username: string,
    public host: string,
    public databaseName?: string,
    public protocol?: string,
    public replicaSet?: string,
    public debug?: boolean,
    public appId?: string,
  ) {}
	
  static create = modelFactory(DatabaseConfig)
}
