import { serve } from '@validator/rest-api-server'
import { DEFAULT_SERVER_CONFIG, _ } from '@validator/rest-api-server/server'
import {
  $, arrayField, constantField, numberField, objectField, optional, stringField
} from '@validator/validator/fields'
import withOpenApi from './withOpenApi'

const itemSpec = objectField({
  title: stringField(),
  description: stringField()
})

const ofItems = {
  data: arrayField(itemSpec)
}

const ofItem = {
  data: itemSpec
}

serve(withOpenApi({
  ...DEFAULT_SERVER_CONFIG,
  routes: [
    _.GET($._('/expected-error')).spec(
      {
        response: {
          data: constantField(42)
        }
      }
    ).handler(
      async () => {
        throw {
          statusCode: 442,
          isPublic: true,
          reason: 'Boom!'
        }
      }
    ),
    _.GET($._('/unexpected-error')).spec(
      {
        response: {
          data: constantField(42)
        }
      },
    ).handler(
      async () => {
        throw {
          reason: 'Boom!'
        }
      }
    ),
    _.GET($._('/items')).spec(
      {
        response: ofItems
      },
    ).handler(
      async () => ({
        data: [
          {
            title: 'Item N',
            description: 'Description'
          }
        ]
      })
    ),
    _.POST($._('/items')).spec(
      {
        request: ofItem,
        response: {
          data: numberField()
        }
      },
    ).handler(
      async () => ({
        data: 42
      })
    ),
    _.GET($._('/items/')._('id', numberField())).spec(
      {
        response: ofItem
      },
    ).handler(
      async (request) => ({
        data:
          {
            title: `Item ${request.pathParams.id}`,
            description: 'Description'
          }
      })
    ),
    _.PUT($._('/items/')._('id', numberField())).spec(
      {
        request: ofItem
      },
    ).handler(
      async () => undefined
    ),
    _.DELETE($._('/items/')._('id', numberField())).spec(
      {}
    ).handler(
      async () => undefined
    ),
    _.PATCH($._('/items/')._('id', numberField())).spec(
      {
        request: {
          data: objectField({
            title: optional(stringField()),
            description: optional(stringField())
          })
        }
      },
    ).handler(
      async () => undefined
    ),
  ]

}))
