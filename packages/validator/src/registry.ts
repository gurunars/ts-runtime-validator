import { Field } from '.'
import { Json } from './Json'

type OfType<Type extends string> = {
  readonly type: Type
}

export const declareField = <
  Type extends string,
  Params extends any[],
  FieldType extends Field<unknown>
> (
    type: Type,
    constructor: new (...params: Params) => FieldType
  ): ((...params: Readonly<Params>) => FieldType & OfType<Type>) & OfType<Type> => {
  const wrapper = (...params: Params): FieldType & OfType<Type> => {
    const result = new constructor(...params) as FieldType & { type: Type }
    result.type = type
    return result
  }
  wrapper.type = type
  return wrapper
}

type GetRepresentation<
  FieldType extends Field<unknown> = Field<unknown>, 
  Type extends string=string
> =
  (
    field: FieldType & OfType<Type>,
    getRepresentation: GetRepresentation
  ) => Json

export type FieldPair<
  FieldType extends Field<unknown> = Field<unknown>,
  Type extends string = string
> =
  [((...params: any[]) => FieldType) & OfType<Type>, GetRepresentation<FieldType, Type>]

const withNoDuplicates = <T extends any[]>(items: T): T => {
  const processed = new Set()
  items.forEach((item) => {
    if (processed.has(item)) {
      throw `Found duplicate of ${item}`
    }
    processed.add(item)
  })
  return items
}

const getValue = <V> (mapping: Record<string, V>, key: string): V => {
  const value = mapping[key]
  if (value === undefined) {
    throw `Could not find element with key '${key}'`
  }
  return value
}

/**
 * This is a generic solution to provide a virtually inlimited number
 * of serializable representations of the field classes.
 *
 * The solution is based on aspect-oriented programming model in
 * a conjunction with a registry design pattern.
 *
 * The registry maps a field creator of a specific type with
 * a function that has to provide a representation of the field.
 *
 * Note: each field subclass should be registered separately
 * including the `WithRegExp` ones.
 */
const createRegistry = (
  pairs: FieldPair[]
): <Type extends string>(field: Field<unknown> & OfType<Type>) => Json => {
  const mapping: Record<any, GetRepresentation> = Object.fromEntries(
    withNoDuplicates(pairs).map(([key, value]) => [key.type, value])
  )
  const getRepresentation = <Key extends string>(
    field: Field<unknown> & OfType<Key>
  ): Json => getValue(mapping, field.type)(field, getRepresentation)
  return getRepresentation
}

export default createRegistry
