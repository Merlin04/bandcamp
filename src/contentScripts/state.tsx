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
    playerDialogOpen: false
});

export type Album = {
    // name: string,
    // artist: string,
    // albumArt: string,
    // url: string,
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
    // const v = await browser.storage.sync.get(null);
    // if(Object.keys(v).length === 0) return defaultStorageValue;
    // // Reconstruct from chunks
    // const stateStr = Object.entries(v)
    //     .sort(([k1], [k2]) => Number(k1.slice(6)) - Number(k2.slice(6)))
    //     .map(([, v]) => v)
    //     .join("");
    
    // try {
    //     const state = JSON.parse(stateStr);
    //     return state;
    // } catch(e) {
    //     if((e as Error).name === "SyntaxError") {
    //         console.error("Failed to parse chunked state: ", stateStr, Object.keys(v));
    //     }
    //     return defaultStorageValue;
    // }

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

//https://stackoverflow.com/a/57071072
// function* chunk(s: string, maxBytes: number) {
//     const decoder = new TextDecoder("utf-8");
//     let buf = new TextEncoder().encode(s);
//     while (buf.length) {
//         let i = buf.lastIndexOf(32, maxBytes+1);
//         // If no space found, try forward search
//         if (i < 0) i = buf.indexOf(32, maxBytes);
//         // If there's no space at all, take all
//         if (i < 0) i = buf.length;
//         // This is a safe cut-off point; never half-way a multi-byte
//         yield decoder.decode(buf.slice(0, i));
//         buf = buf.slice(i+1); // Skip space (if any)
//     }
// }

async function setStorageValue(state: StorageValue) {
    // Firefox has a storage quota of 8kb per key, so we need to split the state into chunks
    const str = JSON.stringify(state);
    // const chunks = [];
    // for(let i = 0; i < str.length; i += 8192) {
    //     chunks.push(str.substring(i, i + 8192));
    //     console.log(chunks[chunks.length - 1].length);
    // }
    // const chunks: string[] = [];
    // for(const s of chunk(str, 6000)) chunks.push(s);

    // await browser.storage.sync.clear();

    // try {
    //     await browser.storage.sync.set(Object.fromEntries(chunks.map((c, i) => [`state.${i}`, c])));
    // } catch(e) {
    //     console.error("Failed to write chunks", e);
    //     console.error("Number of chunks:", chunks.length);
    //     console.error("Chunk lengths", chunks.map(c => c.length));
    //     console.debug(chunks);
    // }

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

    // useEffect(() => {
    //     if(val.__loading) return;
    //     // This will run every render but I'm not sure how to make it better
    //     setStorageValue(val);
    // }, [val]);

    return val.__loading ? null : <>{children}</>;
}