<script lang="ts">
  import { GetGraphStore } from "$houdini";
  import Editor from "$lib/editor/Editor.svelte";
  import type { NodeEditor, NodeEditorSaveData } from "$rete";
  import { sumExample } from "$rete/example";

  let editor: NodeEditor | undefined;
  let editor2: NodeEditor | undefined;

  $: {
    const factory = editor?.factory;
    if (factory) {
      sumExample(factory);
    }
  }

  // let graphStore: GetGraphStore | undefined;
  // $: factory2 = editor2?.factory;
  // $: {
  //   graphStore = new GetGraphStore();
  //   graphStore.fetch({
  //     variables: {
  //       id: "pOqnMJABMXqafJsWylMh",
  //     },
  //   });
  // }
  // $: graph = $graphStore?.data?.graph.graph;
  // $: {
  //   if (graph) {
  //     const promise = async () => {
  //       await factory2?.loadGraph(graph.editorData as NodeEditorSaveData);
  //     }
  //     promise()
  //   }
  // }
  let render = true;
</script>

<div class="flex flex-col h-[100vh]">
  <Editor bind:editor height="h-1/2" {render} />
  <!-- <Editor bind:editor={editor2} height="h-1/2" {render} /> -->
</div>
