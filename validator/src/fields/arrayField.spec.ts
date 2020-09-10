import { arrayField } from '.';
import { TypeHint, validate } from '../core';
import numberField from './numberField';

test('allows valid array to get through', () => {
  const spec = {
    field: arrayField(numberField())
  };
  type Spec = TypeHint<typeof spec>;
  const valid: Spec = validate(spec, {
    field: [1]
  });
  expect(valid.field).toEqual([1]);
});

test('reports an error with full path leading to it if there are issues', () => {
  const spec = {
    field: arrayField(numberField())
  };
  try {
    validate(spec, {
      field: [1, 2, false]
    });
  } catch (err) {
    expect(err).toEqual({'inner': 'Not a number', 'path': ['field', 2]})
  }
});

test('reports an error if value is not an array', () => {
  const spec = {
    field: arrayField(numberField())
  };
  try {
    validate(spec, {
      field: 11
    });
  } catch (err) {
    expect(err).toEqual({'inner': 'Not an array', 'path': ['field']})
  }
});
