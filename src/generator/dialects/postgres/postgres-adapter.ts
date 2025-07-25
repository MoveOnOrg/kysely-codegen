import type { DateParser } from '../../../introspector/dialects/postgres/date-parser';
import type { NumericParser } from '../../../introspector/dialects/postgres/numeric-parser';
import type { TimestampParser } from '../../../introspector/dialects/postgres/timestamp-parser';
import { Adapter } from '../../adapter';
import { ColumnTypeNode } from '../../ast/column-type-node';
import { IdentifierNode } from '../../ast/identifier-node';
import { ModuleReferenceNode } from '../../ast/module-reference-node';
import { ObjectExpressionNode } from '../../ast/object-expression-node';
import { PropertyNode } from '../../ast/property-node';
import { UnionExpressionNode } from '../../ast/union-expression-node';
import {
  JSON_ARRAY_DEFINITION,
  JSON_DEFINITION,
  JSON_OBJECT_DEFINITION,
  JSON_PRIMITIVE_DEFINITION,
  JSON_VALUE_DEFINITION,
} from '../../transformer/definitions';

type PostgresAdapterOptions = {
  dateParser?: DateParser;
  numericParser?: NumericParser;
  timestampParser?: TimestampParser;
};

export class PostgresAdapter extends Adapter {
  // From https://node-postgres.com/features/types:
  // "node-postgres will convert a database type to a JavaScript string if it doesn't have a
  // registered type parser for the database type. Furthermore, you can send any type to the
  // PostgreSQL server as a string and node-postgres will pass it through without modifying it in
  // any way."
  override readonly defaultScalar = new IdentifierNode('string');
  override readonly defaultSchemas = ['public'];
  override readonly definitions = {
    Circle: new ObjectExpressionNode([
      new PropertyNode('x', new IdentifierNode('number')),
      new PropertyNode('y', new IdentifierNode('number')),
      new PropertyNode('radius', new IdentifierNode('number')),
    ]),
    Int8: new ColumnTypeNode(
      new IdentifierNode('string'),
      new UnionExpressionNode([
        new IdentifierNode('string'),
        new IdentifierNode('number'),
        new IdentifierNode('bigint'),
      ]),
      new UnionExpressionNode([
        new IdentifierNode('string'),
        new IdentifierNode('number'),
        new IdentifierNode('bigint'),
      ]),
    ),
    Interval: new ColumnTypeNode(
      new IdentifierNode('IPostgresInterval'),
      new UnionExpressionNode([
        new IdentifierNode('IPostgresInterval'),
        new IdentifierNode('number'),
        new IdentifierNode('string'),
      ]),
      new UnionExpressionNode([
        new IdentifierNode('IPostgresInterval'),
        new IdentifierNode('number'),
        new IdentifierNode('string'),
      ]),
    ),
    Json: JSON_DEFINITION,
    JsonArray: JSON_ARRAY_DEFINITION,
    JsonObject: JSON_OBJECT_DEFINITION,
    JsonPrimitive: JSON_PRIMITIVE_DEFINITION,
    JsonValue: JSON_VALUE_DEFINITION,
    Numeric: new ColumnTypeNode(
      new IdentifierNode('string'),
      new UnionExpressionNode([
        new IdentifierNode('number'),
        new IdentifierNode('string'),
      ]),
      new UnionExpressionNode([
        new IdentifierNode('number'),
        new IdentifierNode('string'),
      ]),
    ),
    Point: new ObjectExpressionNode([
      new PropertyNode('x', new IdentifierNode('number')),
      new PropertyNode('y', new IdentifierNode('number')),
    ]),
    Timestamp: new ColumnTypeNode(
      new IdentifierNode('Date'),
      new UnionExpressionNode([
        new IdentifierNode('Date'),
        new IdentifierNode('string'),
      ]),
      new UnionExpressionNode([
        new IdentifierNode('Date'),
        new IdentifierNode('string'),
      ]),
    ),
  };
  override readonly imports = {
    IPostgresInterval: new ModuleReferenceNode('postgres-interval'),
  };
  // These types have been found through experimentation in Adminer and in the 'pg' source code.
  override readonly scalars = {
    bit: new IdentifierNode('string'),
    bool: new IdentifierNode('boolean'), // Specified as "boolean" in Adminer.
    box: new IdentifierNode('string'),
    bpchar: new IdentifierNode('string'), // Specified as "character" in Adminer.
    bytea: new IdentifierNode('Buffer'),
    cidr: new IdentifierNode('string'),
    circle: new IdentifierNode('Circle'),
    date: new IdentifierNode('Timestamp'),
    float4: new IdentifierNode('number'), // Specified as "real" in Adminer.
    float8: new IdentifierNode('number'), // Specified as "double precision" in Adminer.
    inet: new IdentifierNode('string'),
    int2: new IdentifierNode('number'), // Specified in 'pg' source code.
    int4: new IdentifierNode('number'), // Specified in 'pg' source code.
    int8: new IdentifierNode('Int8'), // Specified as "bigint" in Adminer.
    interval: new IdentifierNode('Interval'),
    json: new IdentifierNode('Json'),
    jsonb: new IdentifierNode('Json'),
    line: new IdentifierNode('string'),
    lseg: new IdentifierNode('string'),
    macaddr: new IdentifierNode('string'),
    money: new IdentifierNode('string'),
    numeric: new IdentifierNode('Numeric'),
    oid: new IdentifierNode('number'), // Specified in 'pg' source code.
    path: new IdentifierNode('string'),
    point: new IdentifierNode('Point'),
    polygon: new IdentifierNode('string'),
    text: new IdentifierNode('string'),
    time: new IdentifierNode('string'),
    timestamp: new IdentifierNode('Timestamp'),
    timestamptz: new IdentifierNode('Timestamp'),
    tsquery: new IdentifierNode('string'),
    tsvector: new IdentifierNode('string'),
    txid_snapshot: new IdentifierNode('string'),
    uuid: new IdentifierNode('string'),
    varbit: new IdentifierNode('string'), // Specified as "bit varying" in Adminer.
    varchar: new IdentifierNode('string'), // Specified as "character varying" in Adminer.
    xml: new IdentifierNode('string'),
  };

  constructor(options?: PostgresAdapterOptions) {
    super();

    if (options?.dateParser === 'string') {
      this.scalars.date = new IdentifierNode('string');
    } else {
      this.scalars.date = new IdentifierNode('Timestamp');
    }

    if (options?.numericParser === 'number') {
      this.definitions.Numeric = new ColumnTypeNode(
        new IdentifierNode('number'),
        new UnionExpressionNode([
          new IdentifierNode('number'),
          new IdentifierNode('string'),
        ]),
        new UnionExpressionNode([
          new IdentifierNode('number'),
          new IdentifierNode('string'),
        ]),
      );
    } else if (options?.numericParser === 'number-or-string') {
      this.definitions.Numeric = new ColumnTypeNode(
        new UnionExpressionNode([
          new IdentifierNode('number'),
          new IdentifierNode('string'),
        ]),
      );
    }

    if (options?.timestampParser === 'string') {
      this.definitions.Timestamp = new ColumnTypeNode(
        new IdentifierNode('string'),
        new UnionExpressionNode([
          new IdentifierNode('Date'),
          new IdentifierNode('string'),
        ]),
        new UnionExpressionNode([
          new IdentifierNode('Date'),
          new IdentifierNode('string'),
        ]),
      );
    }
  }
}
