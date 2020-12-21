import { Field } from '../core'
import { WithRegExp, WithStringInputSupport } from '../WithStringInputSupport'
import { escapeRegex } from '../utils'
import { Primitive, Json } from '../Json'
import { Any } from '../util-types'
import { declareField, OfType } from '../registry'

type Params<Choices> = {
  readonly choices: Choices
}

class ChoiceField<
  Choice extends Primitive,
> implements Field<Choice>, WithStringInputSupport {
  private choicesSet: Set<Primitive>

  constructor(readonly params: Params<readonly Choice[]>) {
    this.choicesSet = new Set(params.choices)
  }
  getFieldWithRegExp(): Field<Any> & WithRegExp {
    return new ChoiceFieldWithRegExp(this.params)
  }

  validate(value: any): Choice {
    if (this.choicesSet.has(value)) {
      return value as Choice
    }
    throw 'Invalid choice'
  }
  serialize(deserialized: Choice): Json {
    return deserialized as unknown as Primitive
  }
}

class ChoiceFieldWithRegExp<
  Choice extends Primitive
> extends ChoiceField<Choice> implements WithRegExp {

  private fullChoiceMap: Map<any, Primitive>

  constructor(readonly params: Params<readonly Choice[]>) {
    super(params)
    this.fullChoiceMap = new Map<any, Primitive>()

    params.choices.forEach(it => {
      this.fullChoiceMap.set(it, it)
      this.fullChoiceMap.set(it.toString(), it)
    })
  }

  get regex() {
    return new RegExp(Object.keys(this.params.choices)
      .map(it => it.toString())
      .map(escapeRegex)
      .join('|')
    )
  }

  validate(value: any): Choice {
    return super.validate(this.fullChoiceMap.get(value))
  }

}

const t = '@validator/fields.ChoiceField' as const

type Type = OfType<typeof t>

const choiceField = declareField(t, ChoiceField) as
  (<Choice extends Primitive> (...choices: readonly Choice[]) => ChoiceField<Choice> & Type) & Type

export default choiceField

