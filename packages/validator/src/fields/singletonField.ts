import { Field } from '../core'
import { Json } from '../Json'

export class SingletonField<Choice extends Json> implements Field<Choice> {

  constructor(readonly choice: Choice) {}

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  validate(_: any): Choice {
    return this.choice
  }
  serialize(_: Choice): Json {
    return this.choice
  }
  getParams(): Json  {
    return
  }
}

const singletonField = <Choice extends Json>(choice: Choice): SingletonField<Choice> => new SingletonField(choice)

export default singletonField
