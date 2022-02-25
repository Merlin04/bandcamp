export default function() {
    return {
        visitor: {
            ImportDeclaration(path) {
                // Get the import's source value
                const source = path.node.source.value;

                if (source.startsWith(".") || source.startsWith("~") || source.startsWith("/")) {
                    path.node.source.value = source + ".js";
                } else {
                    path.node.source.value = "/dist/contentScripts/modules/" + source + ".js";
                }
            }
        }
    };
}