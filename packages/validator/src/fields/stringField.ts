import { Field } from '../core'
import { declareField } from '../docRegistry'
import { Json } from '../Json'
import { WithRegExp, WithStringInputSupport } from '../WithStringInputSupport'

class StringField implements Field<string>, WithStringInputSupport, WithRegExp {
  private regexV?: RegExp;

  constructor(regex?: RegExp) {
    this.regexV = regex
  }
  getFieldWithRegExp(): StringField & WithRegExp {
    return this
  }
  get regex() {
    return this?.regexV || /.*/
  }
  validate(value: any): string {
    if (typeof value !== 'string') {
      throw 'Not a string'
    }
    if (this.regexV) {
      const match = value.match(`^${this.regexV.source}$`)
      if (!match) {
        throw 'Doesn\'t match a regex'
      }
    }
    return value
  }
  serialize(deserialized: string): Json {
    return deserialized
  }
}

export default declareField('@validator/fields.StringField', StringField)
