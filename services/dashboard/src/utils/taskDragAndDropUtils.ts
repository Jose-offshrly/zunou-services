import { Task, TaskStatus, TaskType } from '@zunou-graphql/core/graphql'

export interface Node extends Task {
  isExpanded?: boolean
}

// Flatten tree and mark expanded state
export const flattenTree = (
  tasks: Node[],
  expandedList: string[] = [],
): Node[] => {
  const flatTasks: Node[] = []

  for (const task of tasks) {
    flatTasks.push({
      ...task,
      isExpanded: expandedList.includes(task.id),
    })

    const children = task.children ?? []
    for (const child of children) {
      flatTasks.push({
        ...child,
        isExpanded: expandedList.includes(child.id),
      })
    }
  }

  return reorganizeChildrenBelowParents(flatTasks)
}

// Is target the last child in its parent?
export const isLastChild = (tasks: Node[], targetId: string): boolean => {
  const targetTask = tasks.find((t) => t.id === targetId)
  if (!targetTask || !targetTask.parent) return false

  const siblings = tasks.filter((t) => t.parent?.id === targetTask.parent?.id)
  return siblings.length > 0 && siblings[siblings.length - 1].id === targetId
}

// Get index of last child of a parent
export const getLastChildIndex = (
  tasks: Node[],
  parentId: string,
): number | null => {
  let lastIndex: number | null = null
  tasks.forEach((t, i) => {
    if (t.parent?.id === parentId) lastIndex = i
  })
  return lastIndex
}

// Move a parent's children directly below it
export const moveChildrenAfterParent = (
  tasks: Node[],
  parentId: string,
): Node[] => {
  const parentIndex = tasks.findIndex((t) => t.id === parentId)
  if (parentIndex === -1) return tasks

  const children = tasks.filter((t) => t.parent?.id === parentId)
  if (!children.length) return tasks

  const childrenIds = new Set(children.map((c) => c.id))
  const filtered = tasks.filter((t) => !childrenIds.has(t.id))

  const newParentIndex = filtered.findIndex((t) => t.id === parentId)
  return [
    ...filtered.slice(0, newParentIndex + 1),
    ...children,
    ...filtered.slice(newParentIndex + 1),
  ]
}

// Find closest list type above in Y axis
export const findNearestParentList = (
  tasks: Node[],
  targetId: string,
): Node | null => {
  const targetIndex = tasks.findIndex((t) => t.id === targetId)
  if (targetIndex === -1) return null

  for (let i = targetIndex - 1; i >= 0; i--) {
    if (tasks[i].type === TaskType.List) return tasks[i]
  }
  return null
}

// Reorganize tree to group children under their parents
export const reorganizeChildrenBelowParents = (tasks: Node[]): Node[] => {
  const result: Node[] = []

  const rootTasks = tasks.filter((t) => !t.parent)

  const areAllChildrenCompleted = (parentId: string) => {
    const children = tasks.filter((t) => t.parent?.id === parentId)
    return (
      children.length > 0 &&
      children.every((c) => c.status === TaskStatus.Completed)
    )
  }

  const byOriginalOrder = (a: Node, b: Node) =>
    tasks.indexOf(a) - tasks.indexOf(b)

  const activeRoots = rootTasks
    .filter(
      (t) =>
        t.status !== TaskStatus.Completed && !areAllChildrenCompleted(t.id),
    )
    .sort(byOriginalOrder)

  const completedRoots = rootTasks
    .filter(
      (t) => t.status === TaskStatus.Completed || areAllChildrenCompleted(t.id),
    )
    .sort(byOriginalOrder)

  const appendChildren = (parent: Node) => {
    const children = tasks.filter((t) => t.parent?.id === parent.id)
    const activeChildren = children
      .filter((c) => c.status !== TaskStatus.Completed)
      .sort(byOriginalOrder)
    const completedChildren = children
      .filter((c) => c.status === TaskStatus.Completed)
      .sort(byOriginalOrder)

    result.push(...activeChildren, ...completedChildren)
  }

  for (const root of activeRoots) {
    result.push(root)
    appendChildren(root)
  }

  for (const root of completedRoots) {
    result.push(root)
    appendChildren(root)
  }

  return result
}
