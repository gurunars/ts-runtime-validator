import http from 'http';

import { ValidatorSpec, validate, serialize, TypeHint } from '@validator/validator/core';
import { root, Segment } from '@validator/validator/segmentChain';
import { Json } from '@validator/validator/Json';
import { URL } from 'url';
import { numberField, stringField } from '@validator/validator/fields';

interface MediaTypeProtocol {
  serialize(deserialized: Json): string
  deserialize(serialized: string): Json
}

class JsonProtocol implements MediaTypeProtocol {
  serialize = JSON.stringify;
  deserialize = JSON.parse;
}

type ServerConfig = {
  protocol: MediaTypeProtocol,
  encoding: BufferEncoding
}

const DEFAULT_SERVER_CONFIG: ServerConfig = {
  protocol: new JsonProtocol(),
  encoding: 'utf-8'
}

const mergeServerConfigs = (
  serverConfig: Partial<ServerConfig>
): ServerConfig => ({
  ...DEFAULT_SERVER_CONFIG,
  ...serverConfig,
})

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Blank {}

type HeadersType = Record<string, string | string[]>

type DataType = Record<string, unknown>

type Optional<T> = T | undefined;

type WithOptionalValue<Key extends string, Value> =
  Value extends undefined ? Blank : Record<Key, Value>

type Request<
  PathParams extends Optional<DataType> = undefined,
  Data extends Optional<DataType> = undefined,
  QueryParams extends Optional<DataType> = undefined,
  Headers extends Optional<HeadersType> = undefined
> = { method?: string }
  & WithOptionalValue<'pathParams', PathParams>
  & WithOptionalValue<'data', Data>
  & WithOptionalValue<'headers', Headers>
  & WithOptionalValue<'queryParams', QueryParams>

type Response<
  Data extends Optional<DataType> = undefined,
  Headers extends Optional<HeadersType> = undefined
> = { statusCode?: number }
  & WithOptionalValue<'data', Data>
  & WithOptionalValue<'headers', Headers>

type RequestSpec<
  RequestData extends DataType,
  RequestQueryParams extends DataType,
  RequestHeaders extends HeadersType,
> = {
  data?: ValidatorSpec<RequestData>,
  query?: ValidatorSpec<RequestQueryParams>,
  headers?: ValidatorSpec<RequestHeaders>
}

type WildCardRequestSpec = RequestSpec<DataType, DataType, HeadersType>;

type Route<
  RequestPathParams extends DataType,
  TRequestSpec extends WildCardRequestSpec,
  ResponseData extends DataType,
  ResponseHeaders extends HeadersType
> = {
  method?: string,
  pathSpec: Segment<RequestPathParams>,
  requestSpec: TRequestSpec,
  responseSpec: {
    data?: ValidatorSpec<ResponseData>
    headers?: ValidatorSpec<ResponseHeaders>
  }
  handler: (
    request: Request<
      RequestPathParams,
      TypeHint<TRequestSpec['data']>,
      TypeHint<TRequestSpec['query']>,
      TypeHint<TRequestSpec['headers']>
    >
  ) => Promise<Response<ResponseData, ResponseHeaders>>,
}

type WildCardRoute = Route<any, any, any, any>

const matchRoute = (
  request: http.IncomingMessage,
  route: WildCardRoute
): boolean => {
  if (route.method && request.method !== route.method) {
    return false;
  }
  try {
    route.pathSpec.match(request.url || '');
  } catch (err) {
    return false;
  }
  return true;
};

const getData = async (msg: http.IncomingMessage): Promise<string> => new Promise<string> ((resolve, reject) => {
  try {
    const chunks: string[] = [];
    msg.on('readable', () => chunks.push(msg.read()));
    msg.on('error', reject);
    msg.on('end', () => resolve(chunks.join('')));
  } catch (err) {
    reject(err);
  }
})

const handleRoute = async <
  RequestPathParams extends DataType,
  TRequestSpec extends WildCardRequestSpec,
  ResponseData extends DataType,
  ResponseHeaders extends HeadersType
>(
  config: ServerConfig,
  route: Route<
    RequestPathParams, TRequestSpec,
    ResponseData, ResponseHeaders
  >,
  request: http.IncomingMessage,
  response: http.ServerResponse
): Promise<void> => {
  const url = new URL(request.url || '')

  const data = config.protocol.deserialize(await getData(request));

  const queryParams = route.requestSpec?.query
    ? validate(route.requestSpec.query, Object.fromEntries(url.searchParams))
    : undefined;
  const pathParams = route.pathSpec.match(url.pathname);
  const method = request.method?.toUpperCase();
  const dataProc = route.requestSpec?.data
    ? validate(route.requestSpec.data, data)
    : undefined
  const headers = route.requestSpec?.headers
    ? validate(route.requestSpec.headers, request.headers)
    : undefined

  const resp = await route.handler({
    method: method,
    pathParams: pathParams,
    queryParams: queryParams,
    data: dataProc,
    headers: headers,
  } as any);

  Object.entries(resp.headers || {}).forEach(([key, value]) =>
    response.setHeader(key, value as any)
  );

  response.statusCode = resp.statusCode || data ? 200 : 201;

  if (route.responseSpec?.data) {
    response.write(
      config.protocol.serialize(serialize(route.responseSpec?.data, resp.data)),
      config.encoding
    );
  }

  response.end();
};

const handle = async (
  config: ServerConfig,
  routes: WildCardRoute[],
  request: http.IncomingMessage,
  response: http.ServerResponse
): Promise<void> => {
  const route = routes.find(matchRoute.bind(null, request));
  if (!route) {
    return Promise.reject(404);
  }
  await handleRoute(config, route, request, response);
}

const serve = (config: Partial<ServerConfig>, routes: WildCardRoute[]) => {
  http.createServer(handle.bind(null, mergeServerConfigs(config), routes))
}

const route = <
  RequestPathParams extends DataType,
  TRequestSpec extends WildCardRequestSpec,
  ResponseData extends DataType,
  ResponseHeaders extends HeadersType
> (route: Route<
  RequestPathParams, TRequestSpec,
  ResponseData, ResponseHeaders
>) => route

serve({}, [
  route({
    pathSpec: root._('/')._('username', stringField()),
    responseSpec: {
      data: {
        value: stringField(),
        foo: stringField()
      },
      headers: {
        foo: stringField()
      }
    },
    requestSpec: {
      data: {
        title: stringField()
      },
    },
    handler: async (request) => ({
      data: {
      },
      headers: {
        foo: 'dd'
      }
    })
  })
])
