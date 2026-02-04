import {
  AddBoxOutlined,
  ContentPasteOutlined,
  DescriptionOutlined,
  GroupsOutlined,
  IntegrationInstructionsOutlined,
} from '@mui/icons-material'
import { Divider, Stack } from '@mui/material'

import { SidebarItem } from '~/components/layouts/MainLayout/components/SidebarItem'
import { SidebarItemIcon } from '~/components/layouts/MainLayout/components/SidebarItemIcon'
import { IconActionButton } from '~/components/ui/button/IconActionButton'
import { TabIdentifier } from '~/context/DataSourceContext'

interface CollapsedViewProps {
  onToggleView: () => void
  onOpenDataSourceSetup: (tab: string) => void
}

const ICONS = [
  { icon: ContentPasteOutlined, id: TabIdentifier.CONTENT },
  { icon: GroupsOutlined, id: TabIdentifier.MEETINGS },
  { icon: IntegrationInstructionsOutlined, id: TabIdentifier.INTEGRATIONS },
]

export const CollapsedView = ({
  onToggleView,
  onOpenDataSourceSetup,
}: CollapsedViewProps) => {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      pt={3}
      spacing={2}
      width="100%"
    >
      <IconActionButton onClick={onToggleView} size="small" variant="outlined">
        <DescriptionOutlined fontSize="small" />
      </IconActionButton>
      <IconActionButton
        onClick={() => onOpenDataSourceSetup(TabIdentifier.CONTENT)}
        size="small"
        variant="filled"
      >
        <AddBoxOutlined color="primary" fontSize="small" />
      </IconActionButton>
      <Divider sx={{ width: '60%' }} />
      {ICONS.map(({ icon: Icon, id }, index) => (
        <Stack
          alignItems="center"
          justifyContent="center"
          key={index}
          spacing={1}
        >
          <SidebarItem
            inverted={false}
            onClick={() => onOpenDataSourceSetup(id)}
          >
            <SidebarItemIcon inverted={false} selected={false}>
              <Icon fontSize="small" />
            </SidebarItemIcon>
          </SidebarItem>
          {index !== ICONS.length - 1 ? (
            <Divider sx={{ width: '80%' }} />
          ) : null}
        </Stack>
      ))}
    </Stack>
  )
}
