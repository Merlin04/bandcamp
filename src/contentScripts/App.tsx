import { createTheme, Fab, Zoom } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache, { EmotionCache } from "@emotion/cache";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import React, { useEffect, useMemo } from "react";
import { setState, StorageProvider, useStore } from "./state";
import AppDialog from "./AppDialog";
import PlayerDialog from "./PlayerDialog";
import { ThemeProvider } from "@mui/system";
import { FAB_ZI } from "./zIndices";

let cache: EmotionCache;

export function setupCache(container: HTMLElement) {
    cache = createCache({
        key: "css",
        container
    });
}

const theme = createTheme({
    components: {
        MuiModal: {
            defaultProps: {
                container: () => window._BANDCAMP_COLLECTOR_SHADOW_DOM.children[0]
            }
        }
    }
});

let canGoBackToCloseDialog = false;

export function setOpen(open: boolean) {
    if(open) {
        history.pushState({}, "", "?bc-collector");
        canGoBackToCloseDialog = true;
    } else if(canGoBackToCloseDialog) {
        history.back();
    } else {
        //history.pushState({}, "", "?");
        history.replaceState({}, "", window.location.pathname);
    }
    setState({ open });
}

export default function App() {
    const { open } = useStore(["open"]);

    useEffect(() => {
        function onPopState(e: Event) {
            console.log("History pop state", e);
            // const historyStateOpen = e.state?.open ?? false;
            const historyStateOpen = window.location.search === "?bc-collector";
            console.log("History state open", historyStateOpen);
            console.log("Open", open);
            if(historyStateOpen !== open) {
                console.log("Setting state to", historyStateOpen);
                setState({ open: historyStateOpen });
            }
        }

        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [open]);

    useEffect(() => {
        if(location.search === "?bc-collector") {
            setState({ open: true });
        }
    }, []);

    return (
        <CacheProvider value={cache}>
            <ThemeProvider theme={theme}>
                <Zoom
                    in={!open}
                    unmountOnExit
                >
                    <Fab color="primary" style={{
                        position: "fixed",
                        bottom: 16,
                        right: 16,
                        zIndex: FAB_ZI
                    }} onClick={() => setOpen(true)}>
                        <LibraryMusicIcon />
                    </Fab>
                </Zoom>
                <StorageProvider>
                    <AppDialog />
                </StorageProvider>
            </ThemeProvider>
        </CacheProvider>
    )
}