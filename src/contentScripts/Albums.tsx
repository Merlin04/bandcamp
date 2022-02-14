import { Box, ButtonBase, Checkbox, InputAdornment, TextField, Typography } from "@mui/material";
import Fuse from "fuse.js";
import { Album, PlayerState, setState, useStorage, useStore } from "./state";
import React, { useMemo, useState } from "react";
import { Search } from "@mui/icons-material";

export default function Albums() {
    const [searchText, setSearchText] = useState("");

    const { albums: albumsRaw } = useStorage(["albums"]);
    const fuse = useMemo(() => new Fuse(
        albumsRaw,
        {
            keys: ["data.title", "data.artist", "data.realArtist"]
        }
    ), [albumsRaw]);
    const albumsFiltered = useMemo(() => 
        searchText.trim().length > 0
        ? fuse.search(searchText).map(fuseResult => fuseResult.item)
        : null
    , [fuse, searchText]);
    // Split the albums up by their artist
    const artistShelves = useMemo<[string, Album[]][] | null>(() => {
        // Don't display shelves UI during searches
        // if(albumsFiltered !== null) return null;

        const albums = new Map<string, Album[]>();
        for (const album of albumsRaw) {
            const artist = album.data.realArtist;
            if (!albums.has(artist)) albums.set(artist, []);
            albums.get(artist)!.push(album);
        }
        const shelves = Array.from(albums);
        // Sort shelves by artist name, then sort each shelf's contents by release date
        return shelves.sort(([a], [b]) => a.localeCompare(b)).map(([artist, shelf]) => [
            artist,
            shelf.sort(
                (a, b) =>
                    new Date(b.data.releaseDate).getTime() -
                    new Date(a.data.releaseDate).getTime()
            )
        ]);
    }, [albumsRaw]);

    return (
        <>
            <TextField
                placeholder="Search"
                variant="outlined"
                size="small"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                    )
                }}
                sx={{
                    width: "100%"
                }}
            />
            <Box sx={{
                "& > *": {
                    marginTop: "2rem"
                }
            }}>
                {albumsFiltered === null ? artistShelves!.map(([artist, albums]) => (
                    <Box key={artist}>
                        <Typography
                            variant="h3"
                            sx={{
                                borderBottom: "1px solid #ccc",
                                marginBottom: "1rem"
                            }}
                        >
                            {artist}
                        </Typography>
                        <AlbumGrid albums={albums} />
                    </Box>
                )) : (
                    <AlbumGrid albums={albumsFiltered} isSearch />
                )}
            </Box>
        </>
    );
}

function AlbumGrid({ albums, isSearch }: { albums: Album[], isSearch?: boolean }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "1rem"
            }}
        >
            {albums.map((album) => (
                <Album key={album.data.url} album={album} isSearch={isSearch} />
            ))}
        </Box>
    );
}

function Album({ album, isSearch }: { album: Album, isSearch?: boolean }) {
    const { deleteAlbumsMode, selectedAlbums } = useStore(["deleteAlbumsMode", "selectedAlbums"]);

    const checked = deleteAlbumsMode && selectedAlbums.includes(album.data.url);

    return (
        <ButtonBase sx={{
            flexDirection: "column",
            alignItems: "start",
            justifyContent: "start",
            textAlign: "start"
        }} onClick={(e) => {
            // if(deleteAlbumsMode) {
            //     e.preventDefault();
            //     setState({
            //         selectedAlbums: checked
            //             ? selectedAlbums.filter((url) => url !== album.data.url)
            //             : [...selectedAlbums, album.data.url]
            //     });
            // }
            e.preventDefault();
            setState({
                playerAlbum: album.data.url,
                playerTrack: 0,
                playerDialogOpen: true,
                playerState: PlayerState.PAUSED
            })
        }} onContextMenu={(e) => {
            // Tapping and holding on mobile
            e.preventDefault();
            setState({
                deleteAlbumsMode: true,
                selectedAlbums: [album.data.url]
            });
        }} /*{...(deleteAlbumsMode ? {} : {
            href: album.data.url + "?bc-collector"
        })}*/>
            {deleteAlbumsMode && (
                <Checkbox checked={checked} sx={{
                    pointerEvents: "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    padding: "4px",
                    marginLeft: "8px",
                    marginTop: "8px",
                    // backgroundColor: checked ? "#1976d2" : "transparent",
                    // border: checked ? "none" : "2px solid rgba(0, 0, 0, 0.54)"
                }} />
            )}
            <Box
                component="img"
                src={album.data.imageUrl}
                alt={album.data.title}
                sx={{
                    width: "100%"
                }}
            />
            <Typography variant="h6">
                {album.data.title}
            </Typography>
            {(isSearch || album.data.artist !==
                album.data.realArtist) && (
                <Typography variant="body1">
                    {album.data.artist + (isSearch && album.data.artist !== album.data.realArtist ? " (" + album.data.realArtist + ")" : "")}
                </Typography>
            )}
        </ButtonBase>
    );
}