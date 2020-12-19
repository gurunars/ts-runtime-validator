import { Field, FieldDecorator } from '../core'
import { declareField } from '../registry'
import { Json } from '../Json'
import { Any } from '../util-types'

class WithDefault<T extends Any> implements Field<T>, FieldDecorator {
  constructor(readonly innerField: Field<T>, readonly defaultValue: T) {}

  validate(value: any): T {
    if (value === undefined) {
      value = this.defaultValue
    }
    return this.innerField.validate(value)
  }
  serialize(deserialized: T): Json {
    return this.innerField.serialize(deserialized)
  }
}


export default declareField('@validator/fields.WithDefault', WithDefault) as
  <T extends Any> (innerField: Field<T>, defaultValue: T) => Field<T>
