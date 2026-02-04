import { ArrowRight } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Typography,
} from '@mui/material'
import React from 'react'

interface PulseContainerProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  disabled?: boolean
  collapsed?: boolean // refers to left menu state
  withUnreadBadge?: boolean
  summaryClassName?: string
}

export default function PulseGroupAccordion({
  title,
  children,
  defaultExpanded = true,
  disabled = false,
  collapsed,
  withUnreadBadge = false,
  summaryClassName,
}: PulseContainerProps) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disabled={disabled}
      sx={{
        '&.Mui-expanded': {
          margin: 0,
        },
        '&:before': {
          display: 'none',
        },
        bgcolor: 'transparent',
        boxShadow: 'none',
        width: '100%',
      }}
    >
      <AccordionSummary
        className={summaryClassName}
        expandIcon={collapsed ? undefined : <ArrowRight />}
        sx={{
          '& .MuiAccordionSummary-content': {
            '&.Mui-expanded': {
              margin: 0,
            },
            alignItems: 'center',
            flexGrow: 1,
            gap: 0,
            justifyContent: collapsed ? 'center' : 'space-between',
            margin: 0,
          },

          '& .MuiAccordionSummary-expandIconWrapper': {
            '&.Mui-expanded': {
              transform: 'rotate(90deg)',
            },
            alignItems: 'center',
            bgcolor: 'transparent',
            borderRadius: 1,
            display: collapsed ? 'none' : 'flex',
            justifyContent: 'center',
            margin: 0,
            opacity: 0,
            padding: '8px 6px',

            transition: 'transform 0.3s, opacity 0.2s',
          },

          '&.Mui-expanded': {
            minHeight: 'auto',
          },

          '&:hover': {
            '& .MuiAccordionSummary-expandIconWrapper': {
              opacity: 1,
            },
            backgroundColor: 'action.hover',
          },

          borderRadius: 1,
          minHeight: 'auto',
          padding: 0,
        }}
      >
        <Typography
          color="text.secondary"
          fontWeight="bold"
          sx={{ pl: collapsed ? 0 : 1 }}
          variant="caption"
        >
          {title}
        </Typography>
        {withUnreadBadge && (
          <Badge
            color="secondary"
            sx={{ '& .MuiBadge-badge': { backgroundColor: 'secondary.main' } }}
            variant="dot"
          />
        )}
      </AccordionSummary>

      <AccordionDetails sx={{ px: 0 }}>{children}</AccordionDetails>
    </Accordion>
  )
}
