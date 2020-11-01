import { Segment } from '@validator/validator/segmentChain'
import { Field, validate } from './core'

import { WithRegExp, WithStringInputSupport } from './WithStringInputSupport'

type Method = () => number

type Handler<Methods extends string> = Record<Methods, Method>

class _Route<DeserializedType> extends Segment<DeserializedType> {

  _<Key extends string, ExtraDeserializedType=undefined>(
    key: Key,
    field?: Field<ExtraDeserializedType> & WithStringInputSupport
  ): _Route<[ExtraDeserializedType] extends [undefined] ? DeserializedType : DeserializedType & {
    [P in Key]: ExtraDeserializedType
  }> {
    return new _Route(this, key as any, field) as any
  }

  __lookupGetter__(sprop: string) {
    return (): Method => () => 42
  }

}

export type Route<DeserializedType, Methods extends string> = _Route<DeserializedType> & Handler<Methods> & {

  _<Key extends string, ExtraDeserializedType=undefined>(
    key: Key,
    field?: Field<ExtraDeserializedType> & WithStringInputSupport
  ): Route<[ExtraDeserializedType] extends [undefined] ? DeserializedType : DeserializedType & {
    [P in Key]: ExtraDeserializedType
  }, Methods>

}

class _Server extends _Route<void> {

  serve(): void {
    // Nothing
  }

}

export type CommonHttpMethods = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'trace';

export type Server<Methods extends string = CommonHttpMethods> = _Server & Handler<Methods>
