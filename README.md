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
- Add tootip popup
- Support scientific writing of numbers (e.g. 1e-3)
- Code integration : Update existing node names instead of duplicating
- Make history undo / redo use factory.bulkOperation
- Add index to Context Menu items and fix sorting / enter
### Not important
- make node selection framework agnostic