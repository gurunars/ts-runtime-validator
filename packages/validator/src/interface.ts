import { Json } from './Json'
import { Field, TypeHint, ObjectSpec, ArraySpec, SpecUnion } from './core'
import { undefinedField, arrayField, objectField } from './fields'
import { Any } from './util-types'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isFieldSpec = <DeserializedType>(obj: any): obj is Field<DeserializedType> =>
  obj && typeof obj.validate === 'function' && typeof obj.serialize === 'function'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isObjectSpec = (obj: any): obj is ObjectSpec => {
  console.log(obj)
  const keys = Object.keys(obj)
  for (const i in keys) {
    const key = keys[i]
    if (typeof key !== 'string') {
      return false
    }
    if (!isFieldSpec(obj[key])) {
      return false
    }
  }
  return true
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isArraySpec = (obj: any): obj is ArraySpec => {
  if (!Array.isArray(obj)) {
    return false
  }
  if (obj.length !== 1) {
    return false
  }
  if (!isFieldSpec(obj[0])) {
    return false
  }
  return true
}

const getFieldForSpec = <DeserializedType> (spec: SpecUnion<DeserializedType>): Field<DeserializedType> => {
  if (spec === undefined) {
    return undefinedField()
  } else if (isFieldSpec<DeserializedType>(spec)) {
    return spec
  } else if (isArraySpec(spec)) {
    return arrayField(getFieldForSpec(spec[0])) as unknown as Field<DeserializedType>
  } else if (isObjectSpec(spec)) {
    return objectField(Object.fromEntries(
      Object.entries(spec).map(([key, value]) => [key, getFieldForSpec(value)])
    )) as unknown as Field<DeserializedType>
  } else {
    return undefinedField()
  }
}

// The whole point of the library is to validate wildcard objects
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const validate = <TSpec extends SpecUnion<Any>> (
  spec: TSpec,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  value: any,
): TypeHint<TSpec> => getFieldForSpec(spec).validate(value) as unknown as TypeHint<TSpec>

export const serialize = <TSpec extends SpecUnion<Any>> (
  spec: TSpec,
  value: TypeHint<TSpec>
): Json => getFieldForSpec(spec).serialize(value)
