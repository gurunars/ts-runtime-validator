import { TypeHint } from '../core';

import stringField from './stringField';

import numberField from './numberField';

import segmentChainField, { DynamicSegment, segment as s, SegmentChainSpec } from './segmentChainField';

test('basics', () => {
  type FF = {
    username: string,
    uid: number,
    suid: string
  }

  const ss = s('username', stringField())

  const segments: SegmentChainSpec<FF> = [
    '/',
    ss,
    '/todos/',
    s('uid', numberField()),
    '/subtodos',
    s('suid', numberField()),
  ]

  const spec = {
    value: segmentChainField([
      '/',
      s('username', stringField()),
      '/todos/',
      s('uid', numberField()),
      '/subtodos',
      s('suid', numberField()),
    ])
  }

  type foo = TypeHint<typeof spec>

})
