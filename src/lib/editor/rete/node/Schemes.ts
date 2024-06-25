import type { BaseSchemes, GetSchemes } from 'rete';
import type { Connection, Node } from './Node';
import type { DataflowEngineScheme } from 'rete-engine';

export type Schemes = GetSchemes<Node, Connection<Node, Node>> & BaseSchemes & DataflowEngineScheme;
