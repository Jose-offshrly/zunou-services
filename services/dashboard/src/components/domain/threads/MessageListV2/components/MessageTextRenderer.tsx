import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

const MessageTextRenderer = ({ text }: { text: string }) => {
  return (
    <Markdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
      {text}
    </Markdown>
  )
}

export default MessageTextRenderer
