import { TypeHint } from '@validator/validator'
import { numberField } from '@validator/validator/fields'
import { expectType } from '@validator/validator/TypeTestUtils.test'

import withDoc from './withDoc'

const field = withDoc(numberField(), {
  description: 'Some description',
  examples: {
    zero: {
      value: 14,
      summary: 'Sample value'
    }
  }
})

describe('field', () => {
  it('should proxy the value to the inner field', () => {
    expect(field.validate(42)).toEqual(42)
  })

  it('should annotate params with a description', () => {
    expect(field.getParams()).toEqual({'description': 'Some description',
      'examples': {
        'zero': {
          'summary': 'Sample value',
          'value': 14,
        },
      },
    })
  })
})

test('types', () => {
  type Spec = TypeHint<typeof field>
  expectType<Spec, number>(true)
})
