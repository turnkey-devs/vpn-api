import { easyWriteFile } from '@common/easy_file'
import { safeJsonStringify } from '@common/safe_json_parse'
import ExcelJS from 'exceljs'

const isCollectionOfObject = (arrayObject: unknown) => Array.isArray(arrayObject) && arrayObject.every(item => typeof item === `object` && !Array.isArray(item))
const isCollectionOfArray = (arrayObject: unknown) => Array.isArray(arrayObject) && arrayObject.every(item => Array.isArray(item))
const isAllowedCellValue = (value: unknown) => typeof value === `string` || typeof value === `number`

/**
 * Generate excel file just by collection of objects or arrays
 * 
 * Allowed sheets collections format: 
  [
    {
      keyA: "valA",
      keyB: 123,
      keyC: {
        subKeyC1: "subValC1",
      }
    }
  ]
  or
  [["valA","valB","valC"],[123,456,789]]
  
 * @param request
 * @returns 
 */
export const easyExcel = (request: {
  filename?: string;
  sheets: Array<{
    title?: string;
    columnHeaders?: string[];
    collections: Array<Record<string, any> | any>;
  }>;
}) => {
  const { sheets, filename } = request
  const wb = new ExcelJS.Workbook()
  const worksheetRows = new Map<number | string, Map<number, Array<string | number>>>()
  
  const insertDataRows = (
    collections: Array<Record<string, any> | any>,
    row: number,
    rows: Map<number, Array<string | number>>,
    ws: ExcelJS.Worksheet,
    colIndexes: Array<string | number>,
  ) => {
    for (const item of collections) {
      const values = colIndexes.map(
        key =>
          !isAllowedCellValue(item[key])
            ? safeJsonStringify(item[key])
            : item[key],
      )
      ws.getRow(row).values = values
      rows.set(row, values)
      ++row
    }
  }

  for (const sheet of sheets) {
    const index = sheets.indexOf(sheet)
    const sheetTitle = sheet.title ?? `sheet ${ index + 1 }`
    const sheetColumnHeaders = sheet.columnHeaders ?? []
    const ws = wb.addWorksheet(sheetTitle)

    const columnTitles: string[] = []
    const columnIndexes: string[] = []
    let row = 0
    ++row

    const rows = new Map<number, Array<string | number>>()
    
    if (isCollectionOfObject(sheet.collections)) {
      // Fetch column titles
      for (const item of sheet.collections) {
        const keys = Object.keys(item)
        for (const key of keys) {
          if (!columnIndexes.includes(key)) {
            columnIndexes.push(key)
            columnTitles.push(key)
          }
        }
      }

      // Insert column titles
      ws.getRow(row).values = columnTitles
      ++row
      
      insertDataRows(sheet.collections, row, rows, ws, columnIndexes)
    } else if (isCollectionOfArray(sheet.collections)) {
      // Fetch column titles
      for (const item of sheet.collections) {
        const keys = Object.keys(item)
        for (const key of keys) {
          if (!columnIndexes.includes(key)) {
            columnIndexes.push(key)
            columnTitles.push(`column_${ key }`)
          }
        }
      }

      // Insert column titles
      ws.getRow(row).values = columnTitles
      ++row
      
      insertDataRows(sheet.collections, row, rows, ws, columnIndexes)
    }

    worksheetRows.set(sheetTitle, rows)
  }

  wb.title = filename?.replace(`.xlsx`, ``) ?? `easy_excel_js`
  return {
    workbook: wb,
    filename: `${ wb.title }.xlsx`,
    async toBuffer() {
      return wb.xlsx.writeBuffer()
    },
    async toFile(directoryPath = `.`, filename = this.filename) {
      const buffer = await this.toBuffer()
      easyWriteFile(`${ directoryPath }/${ filename }`, buffer, { raw: true })
    },
    worksheetRows,
  }
}
