(async function() {
    // For some reason it's running twice, no clue why but this should mitigate that
    if(globalThis.contentScriptRan) return;
    globalThis.contentScriptRan = true;

    function log(...args) {
        // noinspection PointlessBooleanExpressionJS
        if(false) { // noinspection UnreachableCodeJS
            log(...args);
        }
    }

    console.log("Running content script (SystemJS loader)");

    /*
     * {
     *     path: string,
     *     linkedSetters: Setter[],
     *     exports: { [key: string]: any }
     * }
     */
    let depCache = {};
    let currentlyRegisteringPath = null;
    let executeFns = [];

    // idk why but some dependencies need this
    globalThis.process = {
        env: {
            NODE_ENV: "development"
        }
    };
    globalThis.__DEV__ = true;

    function normalizePath(currentlyRegisteringPath, path) {
        if(!path) {
            path = currentlyRegisteringPath;
        } else if(!path.startsWith("/")) {
            const base = currentlyRegisteringPath.split("/").slice(0, -1).join("/");
            path = base + "/" + path;
        }

        const fragments = path.split("/");

        for (let i = 0; i < fragments.length; i++) {
            if (fragments[i] === ".") {
                fragments.splice(i, 1);
                i--;
            } else if (fragments[i] === "..") {
                fragments.splice(i - 1, 2);
                i -= 2;
            }
        }

        return fragments.join("/");
    }

    const extensionRoot = browser.runtime.getURL("").slice(0, -1);

    // Load a dependency from a path
    async function systemInternalImport(normalizedDepPath) {
        log("System internal import", normalizedDepPath);
        const depSrc = await fetch(extensionRoot + normalizedDepPath).then(res => res.text()).catch(err => {
            console.error("Failed to fetch dependency", normalizedDepPath, err);
            throw err;
        });
        log("Old currently registering path", currentlyRegisteringPath);
        let oldCurrentlyRegisteringPath = currentlyRegisteringPath;
        currentlyRegisteringPath = normalizedDepPath;
        const promise = new Function("return " + depSrc)();
        log("System internal import promise", promise);
        await promise.catch(err => {
            console.error("Error running module function", normalizedDepPath, err);
            throw err;
        });
        log("Done running register function for module", normalizedDepPath);
        currentlyRegisteringPath = oldCurrentlyRegisteringPath;

        if(!depCache[normalizedDepPath]) throw new Error(`Failed to load dependency ${normalizedDepPath}`);
    }

    const shouldReturnDefaultExportAsExportsObj = (depPath) =>
        /* Object.keys(depCache[currentlyRegisteringPath].exports).length === 1 && depCache[currentlyRegisteringPath].exports.default */
        // ???
        depPath === "/dist/contentScripts/modules/react.js";

    // Called by dependencies to register themselves in the cache
    async function systemRegister(deps, fn) {
        log("System registering", currentlyRegisteringPath);
        log("Deps", deps);
        if(!currentlyRegisteringPath) throw new Error("currentlyRegisteringPath is unset, make sure you aren't calling systemRegister directly");

        const exportFn = (currentlyRegisteringPath => (name, value) => {
            let exports = name;
            if(typeof exports === "string") {
                exports = {};
                exports[name] = value;
            }

            for(const key in exports) {
                depCache[currentlyRegisteringPath].exports[key] = exports[key];
            }

            // Call the setters
            let setterParam;
            if(shouldReturnDefaultExportAsExportsObj(currentlyRegisteringPath)) {
                setterParam = depCache[currentlyRegisteringPath].exports.default ?? {};
                setterParam.default = depCache[currentlyRegisteringPath].exports.default;
            } else {
                setterParam = depCache[currentlyRegisteringPath].exports;
            }

            for(const setter of depCache[currentlyRegisteringPath].linkedSetters) {
                setter(setterParam);
            }

            if(typeof name === "string") return value; else return exports;
        })(currentlyRegisteringPath);

        depCache[currentlyRegisteringPath] = {
            path: currentlyRegisteringPath,
            linkedSetters: [],
            exports: {}
        };

        const { setters, execute } = await fn(exportFn, {
            meta: {
                url: currentlyRegisteringPath,
                resolve: (_id, _parentUrl) => { throw new Error("Resolve is not implemented"); }
            },
            import: systemRelativeImport
        });

        // Load dependencies and call setters
        for(let i = 0; i < deps.length; i++) {
            const dep = deps[i];

            const normalizedDepPath = normalizePath(currentlyRegisteringPath, dep);
            if(!depCache[normalizedDepPath]) {
                await systemInternalImport(normalizedDepPath);
            }

            const depExports = depCache[normalizedDepPath].exports;

            // Object.keys(depExports).length === 1 && depExports.default
            if(shouldReturnDefaultExportAsExportsObj(normalizedDepPath)) {
                const d = depExports.default ?? {};
                d.default = depExports.default;
                setters[i](d);
            } else {
                setters[i](depExports);
            }

            depCache[normalizedDepPath].linkedSetters.push(setters[i]);
        }

        executeFns.push(execute);
    }

    // Load a dependency from a path and execute it
    async function systemImport(normalizedPath) {
        log("System importing", normalizedPath);
        if(!depCache[normalizedPath]) {
            await systemInternalImport(normalizedPath);

            // Call the collected execute functions
            log(`Calling ${executeFns.length} execute functions for import of`, normalizedPath);
            let i = 0;
            for(const executeFn of executeFns) {
                log("Calling execute function", i);
                const res = executeFn();

                if(res instanceof Promise) {
                    await executeFn().catch(err => {
                        console.error("Error running execute function", i, err);
                        throw err;
                    });
                }

                i++;
            }
        }

        return depCache[normalizedPath].exports;
    }

    // Like systemImport, but preserve and use the currentlyRegisteringPath
    async function systemRelativeImport(path) {
        log("System relative importing", path);
        const normalizedPath = normalizePath(currentlyRegisteringPath, path);
        return await systemImport(normalizedPath);
    }

    // async function systemImport(path) {
    //     const normalizedPath = normalizePath(path);
    //     return await systemImportBase(normalizedPath);
    // }

    globalThis.System = {
        register: systemRegister,
        import: systemImport
    };


    log("System: ", System)
    await System.import("/dist/contentScripts/index.module.js");
    console.log("Content script: System done loading modules");
})();