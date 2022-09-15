import { DatabaseConfig } from "../../models/database_config.model"
import { EntityClassType } from "../../models/entity_class.type"

export interface CreateConnectionRequest {
  conID: string;
  entities: EntityClassType[];
  conName?: string;
  config: DatabaseConfig;
}
