import { expectType } from '@validator/validator/TypeTestUtils.test'
import { AllNonNullKeyTypes, KeysOfType, Optional, RequiredKeys, WithoutOptional } from './util-types'

type Input = {
  boolNUll?: boolean,
  boolNonNull: boolean,
  numNull?: number,
  numNonNull: number
}

describe('KeysOfType', () => {

  it('filters type or undefined clause', () => {
    type Keys1 = KeysOfType<Input, number | undefined>
    expectType<Keys1, 'numNull' | 'numNonNull'>(true)
  })

  it('filters only type clause', () => {
    type Keys1 = KeysOfType<Input, number | boolean>
    expectType<Keys1, 'numNonNull' | 'boolNonNull'>(true)
  })

})

test('AllNonNullKeyTypes', () => {
  type KeyTypes = AllNonNullKeyTypes<Input>
  expect<KeyTypes>({} as number | boolean)
})

describe('RequiredKeys', () => {
  it('returns enum of the keys', () => {
    type Keys = RequiredKeys<Input>

    expectType<Keys,'numNonNull' | 'boolNonNull'>(true)
  })

  it('returns never in case if there are no required keys', () => {
    type AllOptional = {
      one?: string,
      two?: number
    }
    type Keys = RequiredKeys<AllOptional>
    expectType<[Keys], [never]>(true)
  })
})

describe('WithoutOptional', () => {
  it('filters out all optional keys', () => {
    type Clean = WithoutOptional<Input>

    expectType<Clean, {
      boolNonNull: boolean;
      numNonNull: number;
    }>(true)
  })

  it('returns undefined object if all keys are undefined', () => {
    type AllOptional = {
      opt1?: string,
      opt2: Optional<string>
    }
    type Clean = WithoutOptional<AllOptional>

    expectType<Clean, undefined>(true)
  })
})
