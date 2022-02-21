import { Alert, Button } from "@mui/material";
import { useMemo } from "react";
import { setStorage, useStorage } from "./state";
import React from "react";
import { thisData, AlbumData } from "./scraper";

// Check if we're on an album page and if the album isn't in the library
export default function AddThisAlbum() {
    const { albums } = useStorage(["albums"]);
    console.log(thisData);

    const shouldShowMessage = useMemo(() => albums.find(a => a.data.url === (thisData as AlbumData).url) === undefined, [albums]);
    
    return shouldShowMessage ? (
        <Alert variant="outlined" severity="info" icon={false} action={
            <Button color="inherit" size="small" onClick={() => {
                setStorage({
                    albums: [
                        ...albums,
                        {
                            data: thisData as AlbumData,
                            tags: (thisData as AlbumData).tags,
                            lastUpdated: new Date().getTime()
                        }
                    ]
                })
            }}>Add album</Button>
        } sx={{
            "& .MuiAlert-action": {
                paddingTop: 0,
                alignItems: "center"
            },
            marginBottom: "1rem"
        }}>
            Oh look, a new album!
        </Alert>
    ) : null;
}