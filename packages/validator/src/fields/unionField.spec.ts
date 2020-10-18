import unionField from './unionField'
import { getParams, serialize, TypeHint, validate } from '../core'
import { expectType } from '../TypeTestUtils.test'
import booleanField from './booleanField'
import choiceField from './choiceField'
import stringField from './stringField'

const choices = choiceField(1, 2, 3)

const field = unionField(
  stringField(),
  choices,
  booleanField()
)

test('validation', () => {
  expect(validate(field, 1)).toEqual(1)
  expect(validate(field, 3)).toEqual(3)
  expect(validate(field, true)).toEqual(true)
  expect(validate(field, 'foo')).toEqual('foo')
})

test('serialization', () => {
  expect(serialize(field, 1)).toEqual(1)
  expect(serialize(field, 3)).toEqual(3)
  expect(serialize(field, true)).toEqual(true)
  expect(serialize(field, 'foo')).toEqual('foo')
})

test('getParams', () => {
  expect(getParams(field)).toEqual({
    'innerSpecs':[
      {'description':'Title'},
      {'choices':[1,2,3]},
      {'description':'Flag'}
    ]})
})

test('types', () => {
  type Spec = TypeHint<typeof field>

  expectType<string | boolean | 1 | 2 | 3>('foo' as Spec)
})
