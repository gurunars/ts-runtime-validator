import { Field, SpecUnion, TypeHint, getParams } from '../core'
import { Json } from '../Json'

type Unioned<T extends SpecUnion<any>[]> = {
  [P in keyof T]: T[P] extends SpecUnion<any> ? TypeHint<T[P]> : never
}[number];

type Params<Variants extends readonly SpecUnion<any>[]> = {
  readonly variants: Variants,
  readonly description?: string
}

class UnionField<
  Variants extends SpecUnion<any>[]
> implements Field<Variants> {

  constructor(readonly params: Params<Variants>) {}

  validate(value: any): Unioned<Variants> {
    throw 'Invalid choice'
  }
  serialize(deserialized: Variants): Json {
    return null
  }
  getParams() {
    return {
      description: this.params.description,
      innerSpecs: this.params.variants.map(getParams)
    }
  }

}


const choiceField = <
  Variants extends SpecUnion<any>[],
> (variants: Variants, description?: string): UnionField<Variants> =>
    new UnionField({
      variants,
      description
    })

export default choiceField
