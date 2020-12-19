import { Field, Json } from '.'
import { SpecUnion } from './core'
import { Any } from './util-types'

type WithType = {
  readonly type: string
}

export const declareField = <Params extends any[], FieldType extends Field<unknown>> (
  type: string,
  constructor: new (...params: Params) => FieldType
): ((...params: Params) => FieldType & WithType) & WithType => {
  const wrapper = (...params: Params): FieldType & WithType => Object.assign(
    {type},
    new constructor(...params)
  )
  return Object.assign({type}, wrapper)
}

type FieldPair<FieldType extends Field<unknown> = Field<unknown>> =
  [(() => FieldType) & WithType, (field: FieldType) => Json]

type Registy = [FieldPair]

const getSchema = (
  ...registries: Registy[]
) => (specs: SpecUnion<Any>) => {
  const mapping: Record<any, (field: Field<unknown>) => Json> = {}
  registries.forEach(registry => {
    registry.forEach(([key, value]) => {
      //(mapping)[key.type] = value
    })
  })

}
