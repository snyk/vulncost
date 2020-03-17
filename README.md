# Vulnerability cost for Snyk

## Release directions

Full installation directions are on [Visual Studio site](https://code.visualstudio.com/api/working-with-extensions/publishing-extension), but in short:

- `npm install -g vsce`
- `vsce package` - this will generate a sharable .vsix file
- `vsce publish <type>` - publishes to `<publisherID>.extension` on VS Code MarketPlace

The `vsce package` will also run npm scripts before compiling the .vsix file: `check` (eslint + prettier) and `webpack` (dist files) if either fail, `vsce` doesn't report what failed so you will need to re-run these checks manually. Otherwise it will generate a (zip) `.vsix` file that can be manually installed using `code --install-extension vscode-vuln-cost-1.0.0.vsix`

To release, ensure the correct type is used in the `vsce publish` - see [Auto-incrementing the extension version](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#autoincrementing-the-extension-version) for details.

## Developing

Using VS Code you need to build and watch for changes using `npm run dev`, then launch the extension in the debugger from VS Code (open command palette, "Debug: select and start debugging", "Launch Extension").

Useful development links

- [Colour definitions](https://code.visualstudio.com/api/references/theme-color)
- [Render options for the decorations](https://code.visualstudio.com/api/references/vscode-api#ThemableDecorationAttachmentRenderOptions)
