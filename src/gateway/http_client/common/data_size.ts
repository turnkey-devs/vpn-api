import { TextEncoder } from 'util'

export const dataSize  = (strOrObj: any,sizeCat: 'KB' | 'MB' | 'B' = 'B') => {
	try {
		if (typeof strOrObj !== 'string')
			strOrObj = safeStringify(strOrObj)
		
		const size = new TextEncoder().encode(strOrObj).length
		
		switch (sizeCat) {
		case 'B':
			return size
		case 'KB':
			return size / 1024
		case 'MB':
			return size / 1024 / 1024
		}
	}
	catch (error) {
		console.warn('dataSize',{ error })
		return -1
	}
}

const safeStringify = <T extends object>(obj:T, indent = 6) => {
	let cache :any[] | null = []
	const retVal = JSON.stringify(
		obj,
		(key, value) =>
			typeof value === 'object' && value !== null ?
				cache?.includes(value) ?
					undefined : // Duplicate reference found, discard key
					cache?.push(value) && value : // Store value in our collection
				value,
		indent,
	)
	cache = null
	return retVal
}
