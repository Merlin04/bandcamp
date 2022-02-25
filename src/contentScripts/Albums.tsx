import {Box, ButtonBase, Checkbox, Chip, CircularProgress, InputAdornment, TextField, Typography, BoxProps} from "@mui/material";
import Fuse from "fuse.js";
import {Album, setState, setStorage, useStorage, useStore} from "./state";
import React, { useMemo, useState } from "react";
import { Search } from "@mui/icons-material";
import {scrapeAlbumUrl} from "./scraper";
import {LayoutGroup, motion} from "framer-motion";

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
            <TagFilterer onChange={() => {}} sx={{
                mt: 2
            }} />
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

function TagFilterer({ onChange, sx, ...boxProps }: {
    onChange: (albums: Album[]) => void
} & BoxProps) {
    const { albums } = useStorage(["albums"]);
    const tagList = useMemo(() => {
        const tags = new Set<string>();
        for (const album of albums) {
            for (const tag of album.tags) {
                tags.add(tag);
            }
        }
        // Sort the tags alphabetically, ignoring case
        return Array.from(tags).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    }, [albums]);

    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Make the tag list but split it into one array of selected tags and one of unselected tags
    const [selected, unselected] = useMemo(() => (
        tagList.reduce<[JSX.Element[], JSX.Element[]]>(([selected, unselected], tag) => {
            const chip = (
                <Chip
                    component={motion.div}
                    layout
                    layoutId={`tag-${tag}`}
                    variant="outlined"
                    key={tag}
                    label={tag}
                    onClick={() => {
                        const newSelectedTags = selectedTags.includes(tag)
                            ? selectedTags.filter(t => t !== tag)
                            : [...selectedTags, tag];
                        setSelectedTags(newSelectedTags);
                        onChange(
                            albums.filter(album => album.data.tags.includes(tag))
                        );
                    }}
                    sx={{
                        zIndex: selectedTags.includes(tag) ? 1 : 0,
                        backgroundColor: (selectedTags.includes(tag)) ? "#ebebeb" : "#ffffff",
                        transition: "backgroundColor 0.2s ease-in-out"
                    }}
                />
            );
            selectedTags.includes(tag) ? selected.push(chip) : unselected.push(chip);

            return [selected, unselected];
        }, [[], []])
    ), [tagList, selectedTags]);

    return (
        <Box sx={{
            "& > *": {
                display: "flex",
                flexWrap: "wrap",
                gap: "8px"
            },
            ...sx
        }} {...boxProps}>
            <LayoutGroup>
                <Box component={motion.div} sx={{
                    ...(selectedTags.length > 0 && {
                        paddingBottom: "1rem",
                        marginBottom: "1rem",
                        borderBottom: "1px solid #ebebeb"
                    }),
                    transition: "paddingBottom 0.2s ease-in-out, marginBottom 0.2s ease-in-out, borderBottom 0.2s ease-in-out"
                }}>
                    {selected}
                </Box>
                <Box component={motion.div}>
                    {unselected}
                </Box>
            </LayoutGroup>
        </Box>
    )
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
                <AlbumTile key={album.data.url} album={album} isSearch={isSearch} />
            ))}
        </Box>
    );
}

//const BANDCAMP_DATA_EXPIRY = /* 1 day, converted to milliseconds */ 86400000;
const BANDCAMP_DATA_EXPIRY = /* 1 second, converted to milliseconds */ 1000;

function AlbumTile({ album, isSearch }: { album: Album, isSearch?: boolean }) {
    const { deleteAlbumsMode, selectedAlbums, playerAlbum } = useStore(["deleteAlbumsMode", "selectedAlbums", "playerAlbum"]);
    const { albums } = useStorage(["albums"]);
    const [loading, setLoading] = useState(false);

    const checked = deleteAlbumsMode && selectedAlbums.includes(album.data.url);

    return (
        <ButtonBase sx={{
            flexDirection: "column",
            alignItems: "start",
            justifyContent: "start",
            textAlign: "start"
        }} onClick={(e) => {
            e.preventDefault();

            if(deleteAlbumsMode) {
                setState({
                    selectedAlbums: checked
                        ? selectedAlbums.filter((url) => url !== album.data.url)
                        : [...selectedAlbums, album.data.url]
                });
            } else {
                const openAlbum = () => {
                    if(playerAlbum === album.data.url) {
                        setState({
                            playerDialogOpen: true
                        });
                    } else {
                        setState({
                            playerDialogAlbum: album.data.url,
                            // playerTrack: 0,
                            playerDialogOpen: true,
                            // playerState: PlayerState.PAUSED
                        });
                    }
                };

                const isExpired = album.lastUpdated + BANDCAMP_DATA_EXPIRY < Date.now();
                if(isExpired) {
                    console.log("Scraping album data...");
                    setLoading(true);
                    scrapeAlbumUrl(album.data.url).then((newAlbumData) => {
                        console.log("Scraped album data", newAlbumData);
                        setStorage({
                            albums: albums.map(a => a.data.url === album.data.url ? { ...album, data: newAlbumData } : a)
                        });
                        openAlbum();
                        setLoading(false);
                    });
                } else {
                    openAlbum();
                }
            }
        }} onContextMenu={(e) => {
            // Tapping and holding on mobile
            e.preventDefault();
            setState({
                deleteAlbumsMode: true,
                selectedAlbums: [album.data.url]
            });
        }} disabled={loading}>
            {loading && (
                <Box sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                }}>
                    <CircularProgress />
                </Box>
            )}
            {deleteAlbumsMode && (
                <Checkbox checked={checked} sx={{
                    pointerEvents: "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    padding: "4px",
                    marginLeft: "8px",
                    marginTop: "8px",
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