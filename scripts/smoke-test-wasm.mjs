import { Parser, Language } from "web-tree-sitter";

const sourcePawnCode = `
#define PLUGIN_VERSION 1.0.0

public Plugin myinfo =
{
    name = "Test",
    author = "Developer",
    description = "demonstrating parser",
    version = PLUGIN_VERSION,
    url = "http://forums.alliedmods.net"
};

public void OnPluginStart() {
    // your code
}
`;

const parse = async () => {
  await Parser.init();
  const lang = await Language.load("tree-sitter-sourcepawn.wasm");
  const parser = new Parser();
  parser.setLanguage(lang);
  const tree = parser.parse(sourcePawnCode);
  console.log(tree.rootNode.toString());
};

parse().catch((e) => {
  console.error(e);
  process.exit(1);
});
