import { Field } from '../core'
import { Json } from '../Json'
import { Any } from '../util-types'
import { WithRegExp, WithStringInputSupport } from '../WithStringInputSupport'

type Spec = {
  canBeFloat: boolean
}

const FieldSymbol = Symbol('@validator/fields.NumberField')

class NumberField implements Field<number, Spec>, WithStringInputSupport {
  constructor(readonly spec: Spec) {}

  type = FieldSymbol

  getFieldWithRegExp(): Field<Any> & WithRegExp {
    return new NumberFieldWithRegExp(this.spec)
  }

  validate(value: any): number {
    if (typeof value !== 'number') {
      throw 'Not a number'
    }
    if (!this.spec.canBeFloat && value !== Math.floor(value)) {
      throw 'Not an int'
    }
    return value
  }
  serialize(deserialized: number): Json {
    return deserialized
  }
}

class NumberFieldWithRegExp extends NumberField implements WithRegExp {

  get regex() {
    const parts: string[] = []
    parts.push('-?')
    parts.push('\\d+')
    if (this.spec.canBeFloat) {
      parts.push('(\\.\\d+)?')
    }

    return RegExp(parts.join(''))
  }

  validate(value: any) {
    return super.validate(Number.parseFloat(value))
  }

}

const numberField = (spec: Spec = {canBeFloat: false}): NumberField => new NumberField(spec)

numberField.type = FieldSymbol

export default numberField
