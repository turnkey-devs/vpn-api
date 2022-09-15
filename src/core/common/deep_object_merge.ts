import { deepmergeCustom } from 'deepmerge-ts'

/**
 * Deepmerge vs deep-merge/deep-extend
 * MERGING DEFAULT VAL BEHAVIOR
 * deepmerge => will leave default / prev obj value if the target obj is null / undefined
 * deep-merge/deep-extend => will replace all value on default obj to target obj
 * MERGING PROPERTIES
 * deepmerge : 
		- has option to replace array or customize it
		- wont clone literal type (example: abstract class, entities), object created from merge will be pure object value. 
 * deep-merge/deep-extend :
		- only replace
		- will clone literal type (example: abstract class, entities), safe for merging entities.
 * solution: TESTED 🧪 deepmerge-ts, will do as our needs, wont replace to undefined, will clone types
*/

const deepmerge = deepmergeCustom({
  mergeArrays: false,
  mergeOthers(values, utils) {
    return utils.defaultMergeFunctions.mergeOthers(values.filter(value => value !== undefined))
  },
})

export const DeepObjectMerge = <Ts extends T[], T extends Record<string, any>>(...objects: Ts) => deepmerge(...objects)

/**
 * Deep Object Plain Merge is for merging plain objects without merging methods, 
 * beware if you want to merge the class properties, use DeepObjectMerge instead
 * @param objects 
 * @returns 
 */
export const DeepObjectPlainMerge = <Ts extends T[], T extends Record<string, any>>(...objects: Ts) => {
  const plainObjects = objects.map(object => ({ ...object })) as Ts
  return deepmerge(...plainObjects)
}
