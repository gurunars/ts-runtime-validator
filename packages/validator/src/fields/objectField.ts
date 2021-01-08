import {
  Field,
  ObjectSpec,
  validate,
  serialize,
  TypeHint,
} from '../core'
import { field } from '../registry'
import { Json } from '../Json'
import { Any } from '../util-types'

export interface ObjectField<
  Spec extends ObjectSpec<Record<string, Any>> = ObjectSpec<Record<string, Any>>
> extends Field<TypeHint<Spec>> {
  readonly objectSpec: Spec
}

export default field('@validator/fields.ObjectField', <
  Spec extends ObjectSpec<Record<string, Any>> = ObjectSpec<Record<string, Any>>
> (
    objectSpec: Spec
  ): ObjectField<Spec> => ({
    objectSpec,
    validate: (value: any): TypeHint<Spec> => {
      if (typeof value !== 'object' || value === null) {
        throw 'Not an object'
      }
      return validate(objectSpec, value) as TypeHint<Spec>
    },
    serialize: (deserialized: TypeHint<Spec>): Json => serialize(objectSpec, deserialized as any),
  }))

