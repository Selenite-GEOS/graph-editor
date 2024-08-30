# Graph editor

A graph editor for visual programming, based on rete and svelte.

## Developing

Once you've installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

Everything inside `src/lib` is part of your library, everything inside `src/routes` can be used as a showcase or preview app.

## Building

To build your library:

```bash
pnpm run package
```

To create a production version of your showcase app:

```bash
pnpm run build
```

You can preview the production build with `pnpm preview`.

## Publishing

Go into the `package.json` and give your package the desired name through the `"name"` option. Also consider adding a `"license"` field and point it to a `LICENSE` file which you can create from a template (one popular option is the [MIT license](https://opensource.org/license/mit/)).

To publish your library to [npm](https://www.npmjs.com):

```bash
pnpm publish
```

## TODO
- Add input values to history
- Add array description on hover
- Support scientific writing of numbers (e.g. 1e-3)
- Code integration : To code : Update existing named XML elements instead of duplicating ? Maybe
- Make history undo / redo use factory.bulkOperation
- Add index to Context Menu items
- Add variables
- Add minimap
- Add auto connection
- Add magnetic connection
- Add panning viewport
- Add progress to big clears
- Maybe, not sure it's better : Give better z index to node labels and nodes on the left / top
- Investigate using okclh for socket colors so it adapts better to different themes
- Implement Javascript node where user can write javascript code to do the processing
- Implement connection breaking when changing array type
- Make UseMass and isThermal from CompositionalMultiphaseFVM be interpreted as a boolean
- Ensure names of XML nodes are valid GEOS group names (no special characters, maybe no spaces)
- Make format node format just an input control
- Example: XML Generation : Remove download node
- Example: Get Array Element : Add display node for every array
- Example: Basic Datatypes: Remove bonjour je suis un ....
### Not important
- make node selection framework agnostic