import {
  Field,
  ValidatorSpec,
  validate,
  serialize,
  getParams,
} from '../core'
import { Json } from '../Json'
import { Any } from '../util-types'

const FieldSymbol = Symbol('@validator/fields.ObjectField')

class ObjectField<
  DeserializedType extends Record<string, Any>,
  SpecType extends { [P in keyof DeserializedType]: Any }
> implements Field<DeserializedType> {
  constructor(readonly objectSpec: ValidatorSpec<DeserializedType, SpecType>) {}
  type = FieldSymbol

  validate(value: any): DeserializedType {
    if (typeof value !== 'object' || value === null) {
      throw 'Not an object'
    }
    return validate(this.objectSpec, value) as DeserializedType
  }
  serialize(deserialized: DeserializedType): Json {
    return serialize(this.objectSpec, deserialized as any)
  }
  get spec(): any {
    return {
      spec: getParams(this.objectSpec),
    }
  }

}

const objectField = <
  DeserializedType extends Record<string, Any>,
  SpecType extends { [P in keyof DeserializedType]: Any }
> (
    objectSpec: ValidatorSpec<DeserializedType, SpecType>,
  ): ObjectField<DeserializedType, SpecType> => new ObjectField(objectSpec)

objectField.type = FieldSymbol

export default objectField
