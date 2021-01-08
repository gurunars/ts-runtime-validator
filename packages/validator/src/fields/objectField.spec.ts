import { numberField, objectField } from '.'
import { TypeHint } from '..'
import { expectType } from '../TypeTestUtils.test'
import { testValidateSpecError, testValidateSpecOk } from './TestUtils.test'

const field = objectField({
  field: objectField({
    num: numberField(),
    subField: objectField({
      subSubField: numberField(),
    }),
  }),
})

describe('field', () => {

  it('allows valid choices to get throw', () => {
    testValidateSpecOk(field, {
      field: {
        num: 42,
        subField: {
          subSubField: 11,
        },
      },
    }, {
      field: {
        num: 42,
        subField: {
          subSubField: 11,
        },
      },
    })
  })

  it('prevents non object go through', () => {
    testValidateSpecError(field, 'foo', 'Not an object')
  })

  it('prevents null (it is also an object) go through', () => {
    testValidateSpecError(field, null, 'Not an object')
  })

})

test('types', () => {

  type Spec = TypeHint<typeof field>;

  expectType<Spec, {
    field: {
      num: number;
      subField: {
          subSubField: number;
      };
    };
  }>(true)

})
