import { DataSourceType, FileType } from '@zunou-graphql/core/graphql'

export const getImageFileType = (extension: string): FileType => {
  switch (extension.toLowerCase()) {
    case 'jpg':
      return FileType.Jpg
    case 'png':
      return FileType.Png
    case 'jpeg':
      return FileType.Jpg
    case 'svg':
      return FileType.Svg
    case 'webp':
      return FileType.Webp
    default:
      throw new Error(`Unknown image file extension '${extension}'`)
  }
}

export const getFileType = (extension: string): FileType => {
  switch (extension.toLowerCase()) {
    case 'csv':
      return FileType.Csv
      break
    case 'doc':
      return FileType.Doc
      break
    case 'docx':
      return FileType.Docx
      break
    case 'html':
      return FileType.Html
      break
    case 'markdown':
    case 'md':
      return FileType.Markdown
      break
    case 'pdf':
      return FileType.Pdf
      break
    case 'ppt':
      return FileType.Ppt
      break
    case 'pptx':
      return FileType.Pptx
      break
    case 'rtf':
      return FileType.Rtf
      break
    case 'txt':
      return FileType.Txt
      break
    case 'xls':
      return FileType.Xls
      break
    case 'xlsx':
      return FileType.Xlsx
      break
    case 'mp4':
      return FileType.Mp4
      break
    case 'png':
      return FileType.Png
      break
    case 'jpg':
    case 'jpeg':
      return FileType.Jpg
      break
    default:
      throw new Error(`Unknown file extension '${extension}'`)
  }
}

export const getDataSourceType = (extension: string): DataSourceType => {
  switch (extension.toLowerCase()) {
    case 'csv':
      return DataSourceType.Csv
      break
    case 'doc':
      return DataSourceType.Doc
      break
    case 'docx':
      return DataSourceType.Docx
      break
    case 'html':
      return DataSourceType.Html
      break
    case 'markdown':
    case 'md':
      return DataSourceType.Markdown
      break
    case 'pdf':
      return DataSourceType.Pdf
      break
    case 'ppt':
      return DataSourceType.Ppt
      break
    case 'pptx':
      return DataSourceType.Pptx
      break
    case 'txt':
      return DataSourceType.Text
      break
    case 'xls':
      return DataSourceType.Xls
      break
    case 'xlsx':
      return DataSourceType.Xlsx
      break
    case 'rtf':
      return DataSourceType.Rtf
      break
    case 'mp4':
      return DataSourceType.Mp4
      break
    default:
      throw new Error(`Unknown data source extension '${extension}'`)
  }
}
