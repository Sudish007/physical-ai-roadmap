// Shared fast-xml-parser setup for the Atom/RSS parsers. Values stay strings (no number coercion),
// entry/item/link/category are always arrays, CDATA is inlined as text, HTML entities are decoded once.
import { XMLParser } from 'fast-xml-parser';
import { ParseError } from '../http.js';

const ARRAY_TAGS = new Set(['entry', 'item', 'link', 'category']);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  cdataPropName: false,
  processEntities: true,
  htmlEntities: true,
  isArray: (name) => ARRAY_TAGS.has(name),
});

/** Parse an XML document; throws ParseError('xml') when the text is not XML or has no feed/rss root. */
export function parseXml(text) {
  let doc;
  try {
    doc = parser.parse(String(text || ''));
  } catch {
    throw new ParseError('xml');
  }
  if (!doc || typeof doc !== 'object' || (!doc.feed && !doc.rss)) throw new ParseError('xml');
  return doc;
}

/** Text of a parsed node: a string, an object with '#text', or the first element of an array. */
export function textOf(node) {
  if (node === null || node === undefined) return '';
  if (Array.isArray(node)) return textOf(node[0]);
  if (typeof node === 'object') return node['#text'] === undefined ? '' : String(node['#text']);
  return String(node);
}

export function toArray(node) {
  if (node === null || node === undefined) return [];
  return Array.isArray(node) ? node : [node];
}
