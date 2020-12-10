import { Field, withErrorDecoration } from '../core'
import { Json } from '../Json'

type Params<T> = {
  itemField: Field<T>
}

class ArrayField<T> implements Field<T[]> {
  constructor(private readonly params: Params<T>) {}

  validate(value: any): T[] {
    if (!Array.isArray(value)) {
      throw 'Not an array'
    }
    return value.map(
      (it, index) => withErrorDecoration(index, () => this.params.itemField.validate(it))
    )
  }
  serialize(deserialized: T[]): Json {
    return deserialized.map(
      (it, index) => withErrorDecoration(index, () => this.params.itemField.serialize(it) as unknown as Json)
    )
  }
  getParams(): Json {
    return {
      itemSpec: this.params.itemField.getParams(),
    }
  }
}

const arrayField = <T> (
  itemField: Field<T>,
): ArrayField<T> =>
    new ArrayField({
      itemField,
    })

export default arrayField
