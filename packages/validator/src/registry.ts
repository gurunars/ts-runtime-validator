import { Field } from '.'
import { Json } from './Json'

export type OfType<Type extends string> = {
  readonly type: Type
}

export type FieldDeclaration<
  Type extends string = string,
  Params extends any[] = any[],
  FieldType extends Field<unknown> = Field<unknown>
> =
  ((...params: Readonly<Params>) => FieldType & OfType<Type>) & OfType<Type>

export const declareField = <
  Type extends string,
  Params extends any[],
  FieldType extends Field<unknown>
> (
    type: Type,
    constructor: new (...params: Params) => FieldType
  ): FieldDeclaration<Type, Params, FieldType> => {
  const wrapper = (...params: Params): FieldType & OfType<Type> => {
    const result = new constructor(...params) as FieldType & { type: Type }
    result.type = type
    return result
  }
  wrapper.type = type
  return wrapper
}

type RequestRepresentation<RepresentationType extends Json> =
  (field: Field<unknown>) => RepresentationType

type ProvideRepresentation<
  RepresentationType extends Json,
  FieldType extends Field<unknown> = Field<unknown>,
  Type extends string = string,
> =
  (
    field: FieldType,
    provideRepresentation: (
      field: FieldType & OfType<Type>,
      requestRepresentation: RepresentationType
    ) => RepresentationType
  ) => RepresentationType

type FieldPair<
  RepresentationType extends Json,
  Declaration extends FieldDeclaration = FieldDeclaration
> =
  [Declaration, ProvideRepresentation<RepresentationType, ReturnType<Declaration>>]

export const $ = <
  RepresentationType extends Json,
  Declaration extends FieldDeclaration<string, any[], Field<unknown>>
>(
    fieldDeclaration: Declaration,
    provideRepresentation: (
      field: ReturnType<Declaration>,
      requestRepresentation: RequestRepresentation<RepresentationType>
    ) => RepresentationType
  ): FieldPair<RepresentationType, FieldDeclaration<string, any[], Field<unknown>>> => [
    fieldDeclaration,
    provideRepresentation as RequestRepresentation<RepresentationType>
  ]

const withNoDuplicates = <T extends any[]>(items: T, by: (item: T[number]) => string): T => {
  const processed = new Set()
  items.forEach((item) => {
    if (processed.has(by(item))) {
      throw `Found duplicate of type declaration '${by(item)}'`
    }
    processed.add(by(item))
  })
  return items
}

const getValue = <V> (mapping: Record<string, V>, type: string): V => {
  const value = mapping[type]
  if (value === undefined) {
    throw `Could not find field of type '${type}'`
  }
  return value
}

export type GetRepresentation<RepresentationType extends Json> =
  <Type extends string>(field: Field<unknown> & OfType<Type>) => RepresentationType

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
const createRegistry = <RepresentationType extends Json> (
  pairs: FieldPair<RepresentationType>[]
): GetRepresentation<RepresentationType> => {
  const mapping = Object.fromEntries(
    withNoDuplicates(pairs, (pair) => pair[0].type).map(([key, value]) => ([key.type, value]))
  )
  const getRepresentation: GetRepresentation<RepresentationType> =
    (field) => getValue(mapping, field.type)(field, getRepresentation)
  return getRepresentation
}

export default createRegistry
