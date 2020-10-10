import { numberField, objectField, stringField } from '@validator/validator/fields';
import { root } from '@validator/validator/segmentChain';
import { GET, serve } from './server';

console.log('FOOOO');


serve({}, [
  GET({
    pathSpec: root._('/')._('username', stringField()),
    responseSpec: {
      data: {
        value: stringField(),
      },
    },
    handler: async (request) => ({
      data: {
        value: 'bla' + request.pathParams.username,
      },
    })
  })
])
