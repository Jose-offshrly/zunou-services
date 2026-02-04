import { BaseEditor } from 'slate'
import { HistoryEditor } from 'slate-history'
import { ReactEditor } from 'slate-react'

export type CustomEditor = BaseEditor &
  ReactEditor &
  HistoryEditor & {
    nodeToDecorations?: Map<Element, Range[]>
  }

export interface MentionType {
  id: string
  name: string
}
export interface CustomText {
  text: string
  bold?: boolean
  underline?: boolean
  strikethrough?: boolean
  italic?: boolean
}

export interface ParagraphElement {
  type: 'paragraph'
  children: CustomText[]
  indent?: number
}

export interface MentionElement {
  type: 'mention'
  mention: MentionType
  children: CustomText[]
}

export interface LinkElement {
  type: 'link'
  url: string
  children: CustomText[]
  indent?: number
}

export interface BulletedListElement {
  type: 'bulleted-list'
  children: ListItemElement[]
}

export interface NumberedListElement {
  type: 'numbered-list'
  children: ListItemElement[]
}

export interface ListItemElement {
  type: 'list-item'
  children: CustomText[]
}

export type CustomElement =
  | ParagraphElement
  | MentionElement
  | LinkElement
  | BulletedListElement
  | NumberedListElement
  | ListItemElement
