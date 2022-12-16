import path from 'path'
import Loki from 'lokijs'
import { RequestContext } from '@server/core/models/request_context'
import { easyExistPath, easyMakeDirectory, isEmpty, nonNullValue, retryAsync } from '@turnkeyid/utils-ts'

export type DBClient = Loki
export type Collection<C extends Record<string, any> = any> = Loki.Collection<C>

const LokiDatabaseClientPool: Map<string, Loki | undefined> = new Map()

export const createNewLokiClient = async <C extends Record<string, any> = any>(
  request: {
    ctx: RequestContext;
    collectionName: string;
  },
) => {
  const { collectionName, ctx } = request
  const databaseFilename = path.resolve(
    nonNullValue(process.env.STORAGE_PATH, true),
    `database`,
    `${ ctx.question_id }_ow_system.db.json`,
  )
  
  if (!easyExistPath(databaseFilename)) 
    easyMakeDirectory(databaseFilename)

  const database = LokiDatabaseClientPool.get(databaseFilename) ?? new Loki(
    databaseFilename,
    {
      verbose: true,
      autoload: true,
      autosave: true,
      autosaveInterval: 5000,
    },
  )
  LokiDatabaseClientPool.set(databaseFilename, database)
  
  const getRepository = async (collectionName: string, maxRetry = 2): Promise<Collection<C>> => {
    if (maxRetry === 0) 
      throw new Error(`Failed to get repository for ${ collectionName }, max retry reached`)
    
    let collection: Collection<C> | undefined = void 0
    try {
      await retryAsync(
        async (_, index) => {
          collection = database.getCollection(collectionName)
          if (!collection) 
            throw new Error(`collection ${ collectionName } is not found!`)
        },
        void 0,
        {
          delayExecutionMs: 50,
        },
      )
    } catch {
      void 0
    }

    if (isEmpty(collection)) {
      database.addCollection(`${ collectionName }`)
      return getRepository(collectionName, maxRetry - 1)
    }

    return collection
  }

  return { collection: await getRepository(collectionName), dbClient: database }
}
