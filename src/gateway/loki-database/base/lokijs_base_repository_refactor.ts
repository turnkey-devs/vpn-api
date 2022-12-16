import type { RequestContext } from "@server/core/models/request_context"
import type { DeepPartial, QueryType } from "@turnkeyid/utils-ts"
import { DeepObjectMerge, isEmpty, arrayFilterFunc, findManyQuery } from "@turnkeyid/utils-ts"
import { DatabaseError } from "@turnkeyid/utils-ts/utils"
import DataLoader from 'dataloader'
import type { Collection } from "../clients/lokidb_client"
import { createNewLokiClient } from "../clients/lokidb_client"

export const LokiJsBaseRepositoryRefactor = async <M extends Record<string, any> = any>(
  _context: RequestContext,
  _request: { collectionName: string },
) => {
  try {
    const { collectionName } = _request
    
    const databaseClient = await createNewLokiClient<M>({ ctx: _context, collectionName })
    const _databaseClient = databaseClient.dbClient
    const _collection: Collection<M> = databaseClient.collection

    const _fetchMDataloader = new DataLoader<QueryType<M> | undefined, Array<M | undefined>>(
      async filters => {
        const result: M[] = _collection?.find({ $and: { $where: filters } }) ?? []
        return filters.map(
          filter => findManyQuery(result, filter),
        )
      },
    )
  
    const findBy = async (filter?: QueryType<M>) => {
      try {
        const results = filter ? (await _fetchMDataloader.load(filter)) : (_collection?.find() ?? [])
        return results.filter(arrayFilterFunc)
      } catch (error) {
      // Do any
        const a = `a`
        throw error
      } finally {
      //
      }
    }
    
    const findByQuery = async (filter: QueryType<M>) => {
      try {
        const results = (_collection?.find(filter as any) ?? [])
        return results.filter(arrayFilterFunc)
      } catch (error) {
      // Do any
        const a = `a`
        throw error
      } finally {
      //
      }
    }

    const findByOne = async (filter: QueryType<M>) => {
      try {
        const results = (await _fetchMDataloader.load(filter))
        return results[0]
      } catch (error) {
      // Do any
        const a = `a`
        throw error
      } finally {
      //  
      }
    }
  
    const create = async (model: M) => {
      try {
        !model.created_at ? (model as any).created_at = new Date() : void 0
        !model.updated_at ? (model as any).updated_at = new Date() : void 0
      
        const inserted = _collection?.insert(model)
        if (!inserted) 
          throw new DatabaseError(`create failed`, { model }) 

        return inserted
      } catch (error) {
      // Do any
        const a = `a`
        throw error
      } finally {
        _databaseClient?.saveDatabase()
      }
    }
  
    const update = async (
      filter: QueryType<M>,
      model: DeepPartial<M>,
      options?: {
        validation?: (...arguments_: any[]
        ) => boolean | Promise<boolean>;
      }) => {
      try {
        const { validation } = options ?? {}
        const found = await findByOne(filter)
        if (isEmpty(found)) 
          throw new DatabaseError(`update failed - data not found`, { filter, model })

        const updatedModel = DeepObjectMerge((found), (model as M)) as M
        (updatedModel as any).updated_at = new Date()
        if (validation) 
          await validation([updatedModel])

        const updated = _collection?.update(updatedModel)
      
        if (!updated) 
          throw new DatabaseError(`update failed`, { model }) 

        return updated
      } catch (error) {
      // Do any
        const a = `a`
        throw error
      } finally {
        _databaseClient?.saveDatabase()
      }
    }
    
    const deleteBy = async (filter: QueryType<M>) => {
      try {
        const found = await findBy(filter)
        if (isEmpty(found)) 
          throw new DatabaseError(`delete failed - data not found`, { filter })
      
        _collection?.remove(found)
        return found
      } catch (error) {
      // Do any
        const a = `a`
        throw error
      } finally {
        _databaseClient?.saveDatabase()
      }
    }

    return { update, create, findBy, findByQuery, findByOne, deleteBy }
  } catch (error) {
    throw new DatabaseError({ message: `FATAL DATABASE ERR`, error })
  }
}
