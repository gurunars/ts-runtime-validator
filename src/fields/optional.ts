import { Field } from '../core';

export type Optional<T> = T | undefined;

export const optionalOf = <T>(): Optional<T> => undefined

export const optional = <T> (validate: (value: any) => T): Field<Optional<T>>  => (value: any): Optional<T> => {
  if (value === undefined) {
    return value
  }
  return validate(value)
}
