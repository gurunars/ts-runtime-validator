import { Field, FieldDecorator } from '../core'
import { declareField, OfType } from '../registry'
import { Json } from '../Json'
import { Any, Optional } from '../util-types'

class OptionalValueDecorator<T extends Any> implements Field<Optional<T>>, FieldDecorator {
  constructor(readonly innerField: Field<T>) {}

  validate(value: any): Optional<T> {
    if (value === undefined) {
      return value
    }
    return this.innerField.validate(value)
  }
  serialize(deserialized: Optional<T>): Json {
    return deserialized === undefined ? deserialized : this.innerField.serialize(deserialized) as any
  }
}

const t = '@validator/fields.Optional' as const
type Type = OfType<typeof t>

export default declareField(t, OptionalValueDecorator) as
  (<T extends Any> (
    innerField: Field<T>
  ) => Field<Optional<T>> & Type) & Type
