import { SpecUnion, TypeHint, ValidatorSpec } from '@validator/validator/core'
import { Segment } from '@validator/validator/segmentChain'
import { StringMapping, Response, Request, Handler, HeaderMapping } from './handler'
import { Any, Optional } from '@validator/validator/util-types'

export type RequestSpec<
  Method extends string = string,
  PathParams extends Optional<StringMapping> = Optional<StringMapping>,
  Data extends Optional<Any> = Optional<Any>,
  QueryParams extends Optional<StringMapping> = Optional<StringMapping>,
  Headers extends Optional<HeaderMapping> = Optional<HeaderMapping>,
> = {
  readonly method: Method,
  readonly pathParams: Segment<PathParams>,
  readonly data?: SpecUnion<Data>,
  readonly queryParams?: ValidatorSpec<QueryParams>,
  readonly headers?: ValidatorSpec<Headers>
}

/**
 * TODO: put it into documentation
 *
 * Each request handler must have only one success code & response
 * combination. I.e. the same handler should not be able to return
 * 200 and 201 codes,
 *
 * As for error handling, error status codes must just comply with
 * the standards.
 */

export type ResponseSpec<
  StatusCode extends number = number,
  Headers extends Optional<HeaderMapping> = Optional<HeaderMapping>,
  Data extends Optional<Any> = Optional<Any>,
> = {
  readonly statusCode: StatusCode
  readonly data?: SpecUnion<Data>,
  readonly headers?: ValidatorSpec<Headers>
}

export type RequestExt<
  Spec extends RequestSpec,
> = Request<
  Spec['method'],
  TypeHint<Spec['pathParams']>,
  TypeHint<Spec['data']>,
  TypeHint<Spec['queryParams']>,
  TypeHint<Spec['headers']>
>

export type ResponseExt<Spec extends ResponseSpec> = Response<
  Spec['statusCode'],
  TypeHint<Spec['data']>,
  TypeHint<Spec['headers']>
>

export type Route<
  ReqSpec extends RequestSpec = RequestSpec,
  RespSpec extends ResponseSpec = ResponseSpec
> = {
  readonly request: ReqSpec,
  readonly response: RespSpec,
  readonly handler: Handler<
    RequestExt<ReqSpec>,
    ResponseExt<RespSpec>
  >
}
