import { Json, Primitive } from './Json'
import { Any } from './util-types'

export interface FieldDecorator {
  innerField: Field<unknown>
}

export interface Field<DeserializedType> {
  validate(value: any): DeserializedType;
  serialize(deserialized: DeserializedType): Json
}

export type ValidatorSpec<DeserializedType extends Any> = {
  [P in keyof DeserializedType]: DeserializedType[P] extends Any ? SpecUnion<DeserializedType[P]> : DeserializedType
};

export type SpecUnion<DeserializedType extends Any> =
  ValidatorSpec<DeserializedType> | Field<DeserializedType> | undefined;

export type TypeHint<Spec extends SpecUnion<Any> | undefined> =
  Spec extends ValidatorSpec<Record<string, Any>> ?
    { [P in keyof Spec]: TypeHint<Spec[P]>; }
  : Spec extends Field<Any> ?
    ReturnType<Spec['validate']>
  : Spec extends Primitive ?
    Spec
  :
    undefined;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withErrorDecoration = <R> (key: any, call: () => R): R => {
  try {
    return call()
  } catch (err) {
    if (err.path && err.inner) {
      throw {
        path: [key, ...err.path],
        inner: err.inner,
      }
    } else {
      throw {
        path: [key],
        inner: err,
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isField = <DeserializedType extends Any>(object: any): object is Field<DeserializedType> =>
  'validate' in object && 'serialize' in object

const mapSpec = <DeserializedType extends Any, TSpec extends SpecUnion<DeserializedType>, R> (
  validatorSpec: TSpec,
  transform: (
    validator: Field<DeserializedType>,
    key: any
  ) => R
): any => {
  if (validatorSpec === undefined) {
    return undefined
  } else if (isField<DeserializedType>(validatorSpec)) {
    return transform(validatorSpec, undefined)
  } else if (Array.isArray(validatorSpec)) {
    return (validatorSpec as any).map(transform)
  } else {
    return Object.fromEntries(
      Object.entries(validatorSpec as ValidatorSpec<{ [property: string]: Any }>).map(
        ([key, validator]: [string, any]) => [key, withErrorDecoration(key, () => transform(validator, key))]
      )
    )
  }
}

const ensureNoExtraFields = <DeserializedType extends Any, TSpec extends SpecUnion<DeserializedType>> (
  validatorSpec: TSpec,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  value: any
) => {
  if (validatorSpec === undefined || isField<DeserializedType>(validatorSpec)|| Array.isArray(validatorSpec)) {
    // OK
  } else {
    const extraKeys = new Set(Object.keys(value))
    Object.keys(validatorSpec as ValidatorSpec<DeserializedType>).forEach((it) => extraKeys.delete(it))
    if (extraKeys.size !== 0) {
      throw {
        extraKeys: Array.from(extraKeys)
      }
    }
  }
}

// The whole point of the library is to validate wildcard objects
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const validate = <TSpec extends SpecUnion<Any>> (
  validatorSpec: TSpec,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  value: any
): TypeHint<TSpec> => {
  const result = mapSpec(validatorSpec,
    (validator, key) => validator.validate(key === undefined ? value : value[key])
  )
  ensureNoExtraFields(validatorSpec, value)
  return result
}

export const serialize = <TSpec extends SpecUnion<Any>> (
  validatorSpec: TSpec,
  value: TypeHint<TSpec>
): Json =>
    mapSpec(validatorSpec, (validator, key) =>
      validator.serialize(key === undefined ? value : (value as any)[key])
    )
