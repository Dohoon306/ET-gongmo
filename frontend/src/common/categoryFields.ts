export type FieldScopedCategory = { id: number; axis: string; code: string; fieldCodes: string[] }

const FIELD_AXIS = 'FIELD'
const FIELD_SCOPED_AXES = ['ROLE', 'SKILL']

function pickedFieldCodes(categories: FieldScopedCategory[], pickedIds: number[]) {
  return categories
    .filter((category) => category.axis === FIELD_AXIS && pickedIds.includes(category.id))
    .map((category) => category.code)
}

function belongsToAnyField(category: FieldScopedCategory, fieldCodes: string[]) {
  return category.fieldCodes.some((fieldCode) => fieldCodes.includes(fieldCode))
}

export function choicesForAxis<T extends FieldScopedCategory>(categories: T[], axis: string, pickedIds: number[]): T[] {
  const inAxis = categories.filter((category) => category.axis === axis)
  if (!FIELD_SCOPED_AXES.includes(axis)) return inAxis
  const fieldCodes = pickedFieldCodes(categories, pickedIds)
  return inAxis.filter((category) => pickedIds.includes(category.id) || belongsToAnyField(category, fieldCodes))
}

export function withoutCategory(categories: FieldScopedCategory[], pickedIds: number[], removed: FieldScopedCategory) {
  const remainingIds = pickedIds.filter((id) => id !== removed.id)
  if (removed.axis !== FIELD_AXIS) return remainingIds
  const remainingFieldCodes = pickedFieldCodes(categories, remainingIds)
  return remainingIds.filter((id) => {
    const picked = categories.find((category) => category.id === id)
    if (picked === undefined || !picked.fieldCodes.includes(removed.code)) return true
    return belongsToAnyField(picked, remainingFieldCodes)
  })
}

export function withFieldsReplaced(categories: FieldScopedCategory[], pickedIds: number[], fieldIds: number[]) {
  const fieldCodes = pickedFieldCodes(categories, fieldIds)
  const kept = pickedIds.filter((id) => {
    const picked = categories.find((category) => category.id === id)
    if (picked === undefined || picked.axis === FIELD_AXIS) return false
    return !FIELD_SCOPED_AXES.includes(picked.axis) || belongsToAnyField(picked, fieldCodes)
  })
  return [...fieldIds, ...kept]
}
