export const highlightMentions = ({
  text,
  color,
}: {
  text: string
  color: string
}): string => {
  const mentionPattern = /@(jira|hubspot|github)\b/gi
  return text.replace(
    mentionPattern,
    `<span style="color: ${color}; font-weight: bold;">$&</span>`,
  )
}
