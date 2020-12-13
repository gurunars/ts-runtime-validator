import { Field, withErrorDecoration } from '../core'
import { Json } from '../Json'

const FieldSymbol = Symbol('@validator/fields.ArrayField')

type ArraySpec<ItemSpec> = {
  readonly itemSpec: ItemSpec
}

class ArrayField<T, ItemSpec> implements Field<T[], ArraySpec<ItemSpec>> {
  constructor(private readonly itemField: Field<T, ItemSpec>) {}
  type = FieldSymbol

  validate(value: any): T[] {
    if (!Array.isArray(value)) {
      throw 'Not an array'
    }
    return value.map(
      (it, index) => withErrorDecoration(index, () => this.itemField.validate(it))
    )
  }
  serialize(deserialized: T[]): Json {
    return deserialized.map(
      (it, index) => withErrorDecoration(index, () => this.itemField.serialize(it) as unknown as Json)
    )
  }
  get spec(): ArraySpec<ItemSpec> {
    return {
      itemSpec: this.itemField.spec,
    }
  }
}

const arrayField = <T, ItemSpec> (
  itemField: Field<T, ItemSpec>,
): ArrayField<T, ItemSpec> =>
    new ArrayField(itemField)

arrayField.type = FieldSymbol

export default arrayField
