import { GET, POST, Route } from '@validator/rest-api-server'
import {
  $, stringField, objectField, booleanField, numberField, arrayField
} from '@validator/validator/fields'
import genOpenApi from './genOpenApi'
import { DEFAULT_SERVER_CONFIG } from '@validator/rest-api-server/server'
import withDoc from './withDoc'

test('fullRoute', () => {
  const routes: Route[] = [
    POST($._('/items'),
      {
        request: {
          data: objectField({
            title: stringField(/.*/),
            count: numberField()
          })
        },
      },
      async () => Promise.resolve(undefined)
    ),
    GET($._('/item/')._('id', stringField()),
      {
        request: {
          headers: objectField({
            key: withDoc(numberField(), {
              description: 'key header',
              examples: {
                sampleKey: {
                  value: 13 as number,
                  summary: 'Sample value'
                }
              }
            })
          }),
          queryParams: objectField({
            flag: booleanField(),
          })
        },
        response: {
          data: objectField({
            items: arrayField(numberField())
          })
        },
      },
      async () => ({
        statusCode: 200,
        data: {
          items: [1, 2, 3]
        }
      })
    )
  ]

  expect(genOpenApi(
    {
      ...DEFAULT_SERVER_CONFIG,
      routes,
      info: {
        title: 'Test',
        version: '1.0.0'
      }
    })).toMatchSnapshot()

})
