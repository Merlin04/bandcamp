import { createTheme, Fab, Zoom, ThemeProvider } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache, { EmotionCache } from "@emotion/cache";
import { LibraryMusic as LibraryMusicIcon } from "@mui/icons-material";
import React, { useEffect } from "react";
import { setState, StorageProvider, useStore } from "./state";
import AppDialog from "./AppDialog";
import { FAB_ZI } from "./zIndices";
import PlayerProvider from "./Player";
import DialogProvider from "./DialogProvider";

let cache: EmotionCache;

export function setupCache(container: HTMLElement) {
    cache = createCache({
        key: "css",
        container
    });
}

const theme = createTheme({
    palette: {
        primary: {
            main: "#61929c"
        },
        secondary: {
            main: "#1da0c3"
        }
    },
    components: {
        MuiModal: {
            defaultProps: {
                container: () =>
                    window._BANDCAMP_COLLECTOR_SHADOW_DOM.children[0]
            }
        }
    }
});

let canGoBackToCloseDialog = false;

export function setOpen(open: boolean) {
    if (open) {
        history.pushState({}, "", "?bc-collector");
        canGoBackToCloseDialog = true;
    } else if (canGoBackToCloseDialog) {
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
            // const historyStateOpen = e.state?.open ?? false;
            const historyStateOpen = window.location.search === "?bc-collector";
            if (historyStateOpen !== open) {
                setState({ open: historyStateOpen });
            }
        }

        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [open]);

    useEffect(() => {
        if (location.search === "?bc-collector") {
            setState({ open: true });
        }
    }, []);

    return (
        <CacheProvider value={cache}>
            <ThemeProvider theme={theme}>
                <Zoom in={!open} unmountOnExit>
                    <Fab
                        color="primary"
                        style={{
                            position: "fixed",
                            bottom: 16,
                            right: 16,
                            zIndex: FAB_ZI
                        }}
                        onClick={() => setOpen(true)}
                    >
                        <LibraryMusicIcon />
                    </Fab>
                </Zoom>
                <StorageProvider>
                    <AppDialog />
                    <PlayerProvider />
                    <DialogProvider />
                </StorageProvider>
            </ThemeProvider>
        </CacheProvider>
    );
}
