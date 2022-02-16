import { createState } from "niue";
import React, { useEffect } from "react";
import { AlbumData } from "./scraper";

export enum PlayerState {
    PLAYING,
    PAUSED,
    INACTIVE
}

export const [useStore, setState] = createState({
    open: false,
    deleteAlbumsMode: false,
    selectedAlbums: [] as string[],
    playerState: PlayerState.INACTIVE,
    // URL for currently playing album (matching the URL in the storage cache)
    playerAlbum: null as null | string,
    playerTrack: null as null | number,
    playerDialogOpen: false,
    playerDialogAlbum: null as null | string
});

export type Album = {
    data: AlbumData,
    tags: string[]
}

type StorageValue = {
    __loading?: boolean,
    albums: Album[]
};

export const defaultStorageValue: StorageValue = {
    albums: []
};

async function getStorageValue() {
    const v = await browser.storage.local.get("state");
    if(!v.state) return defaultStorageValue;
    try {
        const state = JSON.parse(v.state);
        return state;
    } catch(e) {
        if((e as Error).name === "SyntaxError") {
            console.error("Failed to parse state: ", v.state);
        }
        return defaultStorageValue;
    }
}

async function setStorageValue(state: StorageValue) {
    const str = JSON.stringify(state);
    await browser.storage.local.set({
        state: str
    });
}

export const [useStorage, setStorage] = createState<StorageValue>({ __loading: true, ...defaultStorageValue } as StorageValue);

export function StorageProvider({ children }: React.PropsWithChildren<{}>) {
    const val = useStorage();

    if(!val.__loading) setStorageValue(val);

    useEffect(() => {
        (async () => {
            setStorage({
                __loading: false,
                ...await getStorageValue()
            });
        })();
    }, []);

    return val.__loading ? null : <>{children}</>;
}