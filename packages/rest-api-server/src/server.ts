import http from 'http';

import { ValidatorSpec, validate, serialize } from '@validator/validator/core';
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

type HeadersType = Record<string, string | string[]>

type Request<PathParams, Data, QueryParams, Headers extends HeadersType> = {
  method: string,
  pathParams: PathParams,
  queryParams: QueryParams
  data: Data,
  headers: Headers
}

type Response<Data, Headers extends HeadersType> = {
  statusCode: number,
  data: Data,
  headers: Headers
}

type Route<
  RequestPathParams, RequestData, RequestQueryParams, RequestHeaders extends HeadersType,
  ResponseData, ResponseHeaders extends HeadersType
> = {
  method?: string,
  pathSpec: Segment<RequestPathParams>,
  requestSpec?: {
    data?: ValidatorSpec<RequestData>,
    query?: ValidatorSpec<RequestQueryParams>,
    headers?: ValidatorSpec<RequestHeaders>
  },
  responseSpec?: {
    data?: ValidatorSpec<ResponseData>
    headers?: ValidatorSpec<ResponseHeaders>
  }
  handler: (
    request: Request<RequestPathParams, RequestData, RequestQueryParams, RequestHeaders>
  ) => Promise<Response<ResponseData, ResponseHeaders>>,
}

type WildCardRoute = Route<any, any, any, any, any, any>

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

const processNonEmpty = <T, R> (proc: (it: T) => R, value?: T): R | undefined =>
  value ? proc(value) : undefined

const handleRoute = async <
  RequestPathParams, RequestData, RequestQueryParams, RequestHeaders extends HeadersType,
  ResponseData, ResponseHeaders extends HeadersType
>(
  config: ServerConfig,
  route: Route<
    RequestPathParams, RequestData, RequestQueryParams, RequestHeaders,
    ResponseData, ResponseHeaders
  >,
  request: http.IncomingMessage,
  response: http.ServerResponse
): Promise<void> => {
  const url = new URL(request.url || '')

  const data = config.protocol.deserialize(await getData(request));

  const resp = await route.handler({
    method: request.method?.toUpperCase() || 'GET',
    pathParams: route.pathSpec.match(url.pathname),
    queryParams: processNonEmpty(
      (it) => validate(it, Object.fromEntries(url.searchParams)),
      route?.requestSpec?.query
    ),
    data: processNonEmpty(
      (it) => validate(it, data),
      route?.requestSpec?.data
    ),
    headers: processNonEmpty(
      (it) => validate(it, request.headers),
      route?.requestSpec?.headers
    )
  });

  Object.entries(resp.headers).forEach(([key, value]) =>
    response.setHeader(key, value as any)
  );

  response.statusCode = resp.statusCode;

  response.write(
    processNonEmpty(
      (it) => config.protocol.serialize(serialize(it, resp.data)),
      route?.responseSpec?.data
    ) || '',
    config.encoding
  );

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
  RequestPathParams, RequestData, RequestQueryParams, RequestHeaders extends HeadersType,
  ResponseData, ResponseHeaders extends HeadersType
> (route: Route<
  RequestPathParams, RequestData, RequestQueryParams, RequestHeaders,
  ResponseData, ResponseHeaders
>) => route

serve({}, [
  route({
    pathSpec: root._('/')._('username', stringField()),
    responseSpec: {
      headers: {},
      data: {
        value: stringField()
      }
    },
    requestSpec: {
      data: {
        title: numberField()
      },
      query: {}
    },
    handler: async (request) => {
      console.log(request.headers);
      return {
        headers: {},
        statusCode: 200,
        data: {
          value: 'test'
        }
      }
    }
  })
])
