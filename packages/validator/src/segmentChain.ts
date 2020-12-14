import { Field, getParams, validate } from './core'
import { Any } from './util-types'
import { WithRegExp, WithStringInputSupport } from './WithStringInputSupport'

type Merged<Key extends string, BaseType, ExtensionType> =
  [ExtensionType] extends [undefined] ? BaseType : [BaseType] extends [undefined] ?
    {
      [P in Key]: ExtensionType
    } : BaseType & {
      [P in Key]: ExtensionType
    }


export class Segment<
  DeserializedType = undefined,
  SpecType = undefined
> {

  private parent?: Segment<unknown, unknown>
  private key?: string;
  private field?: Field<Any> & WithRegExp
  private regex?: string

  constructor(parent?: Segment<unknown, unknown>, key?: string, field?: Field<Any, Any> & WithStringInputSupport) {
    this.parent = parent
    this.key = key
    this.field = field?.getFieldWithRegExp()
  }

  _<Key extends string, ExtraDeserializedType extends Any = undefined, ExtraSpecType extends Any = undefined>(
    key: Key,
    field?: Field<ExtraDeserializedType, ExtraSpecType> & WithStringInputSupport
  ): Segment<
    Merged<Key, DeserializedType, ExtraDeserializedType>,
    Merged<Key, SpecType, ExtraSpecType>
  > {
    return new Segment(this, key as any, field) as any
  }

  // TODO: make getSegments and getFieldSegments lazy props

  private getSegments(): Segment<unknown, unknown>[] {
    const segments: Segment<unknown, unknown>[] = []
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let cursor: Segment<unknown, unknown> | undefined = this
    while(cursor) {
      segments.push(cursor)
      cursor = cursor.parent
    }
    segments.reverse()
    return segments
  }

  private getFieldSegments(): Segment<unknown, unknown>[] {
    return this.getSegments().filter(segment => segment.field)
  }

  private getRegex(): string {
    if (!this.regex) {
      this.regex = `^${this.getSegments()
        .map(segment => segment.field && segment.key
          ? `(?<${segment.key}>${segment.field.regex.source})`
          : (segment.key || '')
        ).join('')}$`
    }
    return this.regex
  }

  validate(value: string): DeserializedType {
    const matches = value.match(this.getRegex())?.groups
    if (!matches) {
      throw 'Didn\'t match'
    }
    const segments = this.getFieldSegments()
    const spec = Object.fromEntries(segments.map(segment => [segment.key, segment.field]))
    return validate(spec, matches)
  }

  toString(): string {
    return this.getRegex()
  }

  get spec(): SpecType {
    const segments = this.getFieldSegments()
    const spec = Object.fromEntries(segments.map(segment => [segment.key, segment.field]))
    return getParams(spec)
  }
}

export const $ = new Segment<undefined>()
