import { readFileSync, writeFileSync } from 'fs'
import mammoth from 'mammoth'

const files = [
  'Kisi-kisi ASAT PPKn Kelas 4 smtr 2_25-26.docx',
  'Kisi-kisi ASAT Bahasa Inggris Kelas 4 smtr 2_25-26.docx',
]

const base = 'D:\\CodinganDong\\myidea\\projects\\sibete\\kisikisi\\sd4'

for (const f of files) {
  const buffer = readFileSync(`${base}\\${f}`)
  const result = await mammoth.convertToHtml({ buffer })
  writeFileSync(`${base}\\${f.replace('.docx', '.txt')}`, result.value, 'utf-8')
  console.log(`${f}: ${result.value.length} chars extracted`)
}
