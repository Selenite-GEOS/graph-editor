import {hidden, Node, registerNode} from './Node.svelte';

export interface ConfigSchema {


}

@registerNode('Config')
@hidden
export class ConfigNode extends Node {
  config: ConfigSchema = {}
}
