import { theme } from '@zunou-react/services/Theme'

import { LABEL_COLORS } from '../Labels/LabelModal'

/**
 * Get the appropriate text color for a label based on its background color
 * @param color - The background color of the label
 * @returns The text color that provides good contrast
 */
export const getLabelTextColor = (color: string): string => {
  const match = LABEL_COLORS.find((c) => c.value.trim() === color?.trim())
  return match ? match.value : theme.palette.text.primary
}

/**
 * Get data source tooltip message based on various conditions
 * @param hasAccess - Whether user has permission to create data sources
 * @param hasContent - Whether note has title and content
 * @param hasExistingDataSource - Whether note already has a data source
 * @param isCreatingDataSource - Whether data source is currently being created
 * @returns Appropriate tooltip message
 */
export const getDataSourceTooltipMessage = (
  hasAccess: boolean,
  hasContent: boolean,
  hasExistingDataSource: boolean,
  isCreatingDataSource: boolean,
): string => {
  if (!hasAccess) {
    return "You don't have permission to create data sources"
  }
  if (!hasContent) {
    return 'Missing content'
  }
  if (hasExistingDataSource) {
    return 'Data source already exists for this note'
  }
  if (isCreatingDataSource) {
    return 'Creating data source...'
  }
  return 'Add as Data Source'
}
