import { useSortable } from '@dnd-kit/sortable'
import { zodResolver } from '@hookform/resolvers/zod'
import { AssignmentInd, WarningOutlined } from '@mui/icons-material'
import Check from '@mui/icons-material/Check'
import Close from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  alpha,
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  keyframes,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { PulseMember, PulseMemberRole } from '@zunou-graphql/core/graphql'
import { useGenerateJobDescription } from '@zunou-queries/core/hooks/useGenerateJobDescription'
import { useUpdatePulseMemberMutation } from '@zunou-queries/core/hooks/useUpdatePulseMemberMutation'
import Avatar from '@zunou-react/components/utility/Avatar'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import ZunouIcon from '~/assets/zunou-icon'
import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { updatePulseMemberSchema } from '~/schemas/UpdatePulseMemberSchema'
import { toTitleCase } from '~/utils/toTitleCase'

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const subtleRaise = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(-2px); }
`

const wiggleAnimation = keyframes`
  0%, 25%, 50%, 75%, 100% { transform: rotate(0deg); }
  12.5%, 62.5% { transform: rotate(-1deg); }
  37.5%, 87.5% { transform: rotate(1deg); }
`

const expandAnimation = keyframes`
  from { 
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
  }
  to { 
    max-height: 1000px;
    opacity: 1;
    transform: translateY(0);
  }
`

const collapseAnimation = keyframes`
  from { 
    max-height: 1000px;
    opacity: 1;
    transform: translateY(0);
  }
  to { 
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
  }
`

const DESCRIPTION_CHAR_LIMIT = 150
const RESPONSIBILITIES_INITIAL_LIMIT = 5

interface MemberEditForm {
  organizationUserId: string
  jobDescription: string
  responsibilities: string[]
}

interface MemberCardProps {
  member: PulseMember & {
    groupId?: string
    order?: number | null
  }
  isExpanded?: boolean
  canEdit: boolean
}

export const MemberCard = ({
  member,
  isExpanded = false,
  canEdit,
}: MemberCardProps) => {
  const { t } = useTranslation(['common', 'org'])
  const { pulseId } = useParams()
  const [expanded, setExpanded] = useState(isExpanded)
  const [isEditing, setIsEditing] = useState(false)
  const [isAIGenerated, setIsAIGenerated] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isDragHovering, setIsDragHovering] = useState(false)
  const [shouldAnimate] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showAllResponsibilities, setShowAllResponsibilities] = useState(false)
  const isGuest = member.role === PulseMemberRole.Guest
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false)

  const { mutateAsync: updateUser } = useUpdatePulseMemberMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId,
      pulseMemberId: member.id,
    },
  })

  const { mutateAsync: generateJobDesc, isPending: isGenerateJobDescPending } =
    useGenerateJobDescription({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      data: {
        groupId: member.groupId,
        order: member.order,
        type: 'member',
      },
      disabled: !canEdit,
      id: member.id,
    })

  useEffect(() => {
    if (isDragging && expanded) {
      setExpanded(false)
    }
  }, [isDragging])
  const translateX = transform ? transform.x : 0
  const translateY = transform ? transform.y : 0
  const transformValue = transform
    ? `translateX(${translateX}px) translateY(${translateY}px)`
    : 'none'

  const generateEntitiesFromText = async (skipConfirmation = false) => {
    if (!member?.user?.name) {
      toast.error('User name is missing. Cannot generate job description.')
      return
    }

    // Check if there's existing content and show confirmation if needed
    const hasExistingContent =
      (member.job_description && member.job_description.length > 0) ||
      (member.responsibilities && member.responsibilities.length > 0)

    if (hasExistingContent && !skipConfirmation) {
      setShowOverrideConfirm(true)
      return
    }

    try {
      const response = await generateJobDesc(member.id)

      setIsAIGenerated(true)
      // Only update form values, don't save to backend
      setValue('jobDescription', response.generateJobDescription.jobDescription)
      setValue(
        'responsibilities',
        response.generateJobDescription.responsibilities as string[],
      )
      setExpanded(true)
      setIsEditing(true)
    } catch (error) {
      console.error('Error generating entities:', error)
      toast.error('Something went wrong while generating job information.')
    }
  }

  const handleGenerateClick = () => {
    setShowOverrideConfirm(true)
  }

  useEffect(() => {
    setExpanded(isExpanded)
  }, [isExpanded])

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<MemberEditForm>({
    defaultValues: {
      jobDescription: member.job_description ?? '',
      organizationUserId: member.organizationUser?.id || '',
      responsibilities:
        member.responsibilities?.filter((r: string | null) => r !== null) ?? [],
    },
    resolver: zodResolver(updatePulseMemberSchema),
  })

  useEffect(() => {
    if (member.organizationUser?.id) {
      setValue('organizationUserId', member.organizationUser.id)
    }
  }, [member.organizationUser?.id, setValue])

  const onSubmit = (data: MemberEditForm) => {
    updateUser(
      {
        jobDescription: data.jobDescription,
        pulseMemberId: member.id,
        responsibilities: data.responsibilities,
      },
      {
        onError: () => {
          toast.error('Failed to update pulse member')
        },
        onSuccess: () => {
          setValue('jobDescription', data.jobDescription)
          setValue('responsibilities', data.responsibilities)

          setIsEditing(false)
          setIsAIGenerated(false)
          toast.success('Pulse member updated successfully')
        },
      },
    )
  }

  const handleExpandClick = () => {
    if (!isDragging) {
      if (expanded) {
        setValue('jobDescription', member.job_description ?? '')
        setValue(
          'responsibilities',
          member.responsibilities?.filter((r: string | null) => r !== null) ??
            [],
        )
        setIsEditing(false)
        setIsAIGenerated(false)
      }
      setExpanded(!expanded)
    }
  }

  const handleMouseEnter = () => {
    if (!isDragging) setIsHovering(true)
  }

  const handleMouseLeave = () => {
    if (!isDragging) setIsHovering(false)
  }

  const handleDragHandleMouseEnter = () => {
    if (!isDragging) setIsDragHovering(true)
  }

  const handleDragHandleMouseLeave = () => {
    if (!isDragging) setIsDragHovering(false)
  }

  // Helper function to check if description should be truncated
  const shouldTruncateDescription = (description: string) => {
    return description && description.length > DESCRIPTION_CHAR_LIMIT
  }

  // Helper function to get truncated description
  const getTruncatedDescription = (description: string) => {
    if (!shouldTruncateDescription(description)) return description
    return description.substring(0, DESCRIPTION_CHAR_LIMIT) + '...'
  }

  // Helper function to check if responsibilities should be truncated
  const shouldTruncateResponsibilities = (
    responsibilities: (string | null)[],
  ) => {
    return (
      responsibilities &&
      responsibilities.length > RESPONSIBILITIES_INITIAL_LIMIT
    )
  }

  // Helper function to get visible responsibilities
  const getVisibleResponsibilities = (responsibilities: (string | null)[]) => {
    if (
      !shouldTruncateResponsibilities(responsibilities) ||
      showAllResponsibilities
    ) {
      return responsibilities
    }
    return responsibilities.slice(0, RESPONSIBILITIES_INITIAL_LIMIT)
  }

  // Helper function to get remaining count
  const getRemainingCount = (responsibilities: (string | null)[]) => {
    return responsibilities.length - RESPONSIBILITIES_INITIAL_LIMIT
  }

  return (
    <Stack
      bgcolor={theme.palette.background.paper}
      ref={setNodeRef}
      sx={{
        asimation: shouldAnimate
          ? `${wiggleAnimation} 0.3s ease-in-out`
          : isDragging
            ? 'none'
            : `${fadeIn} 0.3s ease-in-out`,
        border: 1,
        borderColor:
          isHovering && canEdit
            ? alpha(theme.palette.primary.main, 0.5)
            : isDragging
              ? alpha(theme.palette.primary.main, 0.7)
              : alpha(theme.palette.text.primary, 0.5),
        borderRadius: 4,
        opacity: isDragging ? 0.7 : 1,
        position: 'relative',
        touchAction: 'none',
        transform: transformValue,
        width: '100%',
      }}
    >
      <Stack
        divider={<Divider />}
        sx={{
          alignItems: 'center',
          borderRadius: 4,
          p: 1,
        }}
      >
        {isEditing ? (
          <Stack p={1} spacing={1} width="100%">
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
            >
              <Typography fontSize="16px" fontWeight="bold">
                {t('edit_person', { ns: 'org' })}
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton
                  disabled={isGenerateJobDescPending}
                  onClick={handleGenerateClick}
                  size="small"
                  sx={{
                    border: 1,
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '100%',
                    opacity: isGenerateJobDescPending ? 0.5 : 1,
                  }}
                >
                  <ZunouIcon />
                </IconButton>
                <IconButton
                  onClick={() => {
                    handleExpandClick()
                  }}
                  size="small"
                  sx={{
                    border: 1,
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '100%',
                  }}
                >
                  <Close />
                </IconButton>
                <IconButton
                  onClick={handleSubmit(onSubmit)}
                  size="small"
                  sx={{
                    border: 1,
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '100%',
                  }}
                >
                  <Check />
                </IconButton>
              </Stack>
            </Stack>
            <Divider />
          </Stack>
        ) : null}
        {isAIGenerated ? (
          <Stack
            alignItems="center"
            bgcolor={theme.palette.primary.main}
            borderRadius={1}
            color="common.white"
            justifyContent="center"
            p={0.5}
            width="100%"
          >
            <Typography variant="caption">
              {t('ai_generated', { ns: 'org' })}
            </Typography>
          </Stack>
        ) : null}
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            p: 1,
            width: '100%',
          }}
        >
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              transition: 'transform 0.2s ease',
            }}
          >
            {canEdit && (
              <Box
                {...attributes}
                {...listeners}
                onMouseEnter={handleDragHandleMouseEnter || handleMouseEnter}
                onMouseLeave={handleDragHandleMouseLeave || handleMouseLeave}
                sx={{
                  '&:active': {
                    cursor: 'grabbing',
                  },
                  alignItems: 'center',
                  cursor: 'grab',
                  display: 'flex',
                }}
              >
                <DragIndicatorIcon
                  sx={{
                    animation: isDragging
                      ? `${subtleRaise} 0.5s ease-in-out infinite alternate`
                      : 'none',
                    color:
                      (isDragHovering || isDragging) && canEdit
                        ? theme.palette.primary.main
                        : 'text.secondary',
                    mr: 1,
                    transition: 'color 0.2s ease',
                  }}
                />
              </Box>
            )}

            <Badge
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              badgeContent={isGuest ? <AssignmentInd fontSize="small" /> : null}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: 'white',
                  color: theme.palette.common.gold,
                  fontSize: 12,
                  height: 16,
                  right: 24,
                  top: 28,
                  width: 16,
                },
              }}
            >
              <Avatar
                placeholder={member.user.name ?? ''}
                size="large"
                src={member.user.gravatar ?? ''}
                sx={{
                  mr: 2,
                }}
                variant="circular"
              />
            </Badge>
          </Box>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              flex: 1,
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            <Stack
              sx={{
                // Allow shrinking
                flex: 1,
                // Take available space
                gap: 1,
                minWidth: 0,
              }}
            >
              <Typography
                fontWeight="bold"
                sx={{
                  overflowWrap: 'break-word',
                  width: '100%',
                  wordBreak: 'break-word',
                }}
                variant="subtitle2"
              >
                {member.user.name ?? ''}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                variant="subtitle2"
              >
                {member.organizationUser?.jobTitle}
              </Typography>
              {member.role && member.role.length > 0 && (
                <Box
                  sx={{
                    bgcolor:
                      member.role === PulseMemberRole.Owner ||
                      member.role === PulseMemberRole.Admin
                        ? alpha(theme.palette.primary.main, 0.1)
                        : member.role === PulseMemberRole.Staff
                          ? alpha(theme.palette.secondary.main, 0.1)
                          : alpha(theme.palette.common.gold, 0.1),
                    borderRadius: 1,
                    color: 'text.secondary',
                    fontSize: 'small',
                    mt: 0.5,
                    px: 1.5,
                    py: 0.5,
                    width: 'fit-content',
                  }}
                >
                  {toTitleCase(member.role)}
                </Box>
              )}
            </Stack>

            {!isEditing && canEdit && (
              <IconButton
                onClick={() => {
                  setIsEditing(true)
                  setExpanded(true)
                }}
                size="small"
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'scale(1.1)',
                  },
                  flexShrink: 0,
                  p: 1,
                  transition: 'all 0.2s ease', // Prevent shrinking
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        <Collapse
          in={expanded && !isDragging}
          sx={{
            animation: expanded
              ? `${expandAnimation} 0.3s ease-out forwards`
              : `${collapseAnimation} 0.3s ease-in forwards`,
            overflow: 'hidden',
            pb: 2,
            px: 2,
            width: '100%',
          }}
          timeout="auto"
          unmountOnExit={true}
        >
          <form id="memberEditForm" onSubmit={handleSubmit(onSubmit)}>
            {/* Hidden field for organizationUserId */}
            <input type="hidden" {...register('organizationUserId')} />

            <Typography
              color="text.secondary"
              fontSize="12px"
              fontWeight="medium"
              sx={{ mb: 2 }}
              variant="caption"
            >
              {t('job_description', { ns: 'org' })}
            </Typography>

            {isGenerateJobDescPending ? (
              <Skeleton height="100px" variant="text" width="100%" />
            ) : (
              <>
                {isEditing ? (
                  <TextField
                    {...register('jobDescription')}
                    error={!!errors.jobDescription}
                    fullWidth={true}
                    helperText={errors.jobDescription?.message}
                    multiline={true}
                    required={true}
                    rows={3}
                  />
                ) : (
                  <>
                    {member.job_description &&
                    member.job_description?.length > 0 ? (
                      <Typography
                        color="text.primary"
                        mb={2}
                        sx={{ wordBreak: 'break-word' }}
                        variant="body2"
                      >
                        {showFullDescription
                          ? member.job_description
                          : getTruncatedDescription(member.job_description)}
                        {shouldTruncateDescription(member.job_description) && (
                          <Button
                            disableRipple={true}
                            onClick={() =>
                              setShowFullDescription(!showFullDescription)
                            }
                            size="small"
                            sx={{
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              },
                              color: 'primary.main',
                              fontSize: '14px',
                              fontWeight: 'normal',
                              minWidth: 'auto',
                              ml: 0.5,
                              p: 0,
                              textTransform: 'none',
                              verticalAlign: 'baseline',
                            }}
                            variant="text"
                          >
                            {showFullDescription
                              ? t('see_less')
                              : t('see_more')}
                          </Button>
                        )}
                      </Typography>
                    ) : (
                      <Typography
                        color="text.secondary"
                        fontSize="12px"
                        fontStyle="italic"
                        mb={2}
                      >
                        {t('no_job_description', { ns: 'org' })}
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}

            <Typography
              color="text.secondary"
              fontSize="12px"
              fontWeight="medium"
              sx={{ mb: 2 }}
              variant="caption"
            >
              {t('responsibilities', { ns: 'org' })}
            </Typography>

            {isGenerateJobDescPending ? (
              <Skeleton height="100px" variant="text" width="100%" />
            ) : (
              <>
                {isEditing ? (
                  <Controller
                    control={control}
                    name="responsibilities"
                    render={({ field }) => {
                      const value = Array.isArray(field.value)
                        ? field.value.join(', ')
                        : field.value || ''

                      return (
                        <TextField
                          {...field}
                          error={!!errors.responsibilities}
                          fullWidth={true}
                          helperText={errors.responsibilities?.message}
                          onBlur={() => {
                            if (typeof field.value === 'string') {
                              const responsibilities = (field.value as string[])
                                .toString()
                                .split(',')
                                .map((r: string) => r.trim())
                                .filter((r: string) => r.length > 0)
                              field.onChange(responsibilities)
                            }
                          }}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder={t('enter_responsibilities', {
                            ns: 'org',
                          })}
                          required={true}
                          value={value}
                        />
                      )
                    }}
                  />
                ) : (
                  <>
                    {member.responsibilities &&
                    member.responsibilities?.length > 0 ? (
                      <Stack spacing={1}>
                        {getVisibleResponsibilities(
                          member.responsibilities,
                        )?.map(
                          (responsibility: string | null, index: number) => (
                            <Stack
                              alignItems="center"
                              bgcolor={alpha(theme.palette.secondary.main, 0.1)}
                              borderRadius={2}
                              color={theme.palette.text.secondary}
                              justifyContent="center"
                              key={index}
                              py={0.5}
                            >
                              <Typography
                                color="text.secondary"
                                fontSize="14px"
                                px={1}
                                sx={{ wordBreak: 'break-word' }}
                              >
                                {responsibility}
                              </Typography>
                            </Stack>
                          ),
                        )}
                        {shouldTruncateResponsibilities(
                          member.responsibilities,
                        ) && (
                          <Button
                            onClick={() =>
                              setShowAllResponsibilities(
                                !showAllResponsibilities,
                              )
                            }
                            size="small"
                            sx={{
                              alignSelf: 'flex-start',
                              color: 'primary.main',
                              fontSize: '14px',
                              fontWeight: 'normal',
                              minWidth: '100%',
                              mt: 1,
                              p: 0,
                              textTransform: 'none',
                            }}
                            variant="outlined"
                          >
                            {showAllResponsibilities
                              ? 'See less'
                              : `+${getRemainingCount(member.responsibilities)} more`}
                          </Button>
                        )}
                      </Stack>
                    ) : (
                      <Typography
                        color="text.secondary"
                        fontSize="12px"
                        fontStyle="italic"
                      >
                        {t('no_responsibilities', { ns: 'org' })}
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}
          </form>
        </Collapse>
      </Stack>
      <IconButton
        onClick={handleExpandClick}
        size="small"
        sx={{
          '&:hover': {
            backgroundColor: alpha(theme.palette.text.primary, 0.1),
          },
          backgroundColor: alpha(theme.palette.text.secondary, 0.1),
          borderRadius: 4,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          transition: 'background-color 0.2s ease',
          width: '100%',
        }}
      >
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </IconButton>
      <CustomModalWithSubmit
        isOpen={showOverrideConfirm}
        onCancel={() => setShowOverrideConfirm(false)}
        onClose={() => setShowOverrideConfirm(false)}
        onSubmit={() => {
          setShowOverrideConfirm(false)
          generateEntitiesFromText(true)
        }}
        submitText={t('generate')}
        title={t('override_content', { ns: 'org' })}
      >
        <Stack alignItems="center" justifyContent="center" spacing={1}>
          <WarningOutlined
            sx={{ color: theme.palette.primary.main, fontSize: 40 }}
          />
          <Typography
            color="text.secondary"
            fontSize="14px"
            textAlign="center"
            variant="body2"
            width="80%"
          >
            {t('override_content_warning_msg', { ns: 'org' })}
          </Typography>
        </Stack>
      </CustomModalWithSubmit>
    </Stack>
  )
}
