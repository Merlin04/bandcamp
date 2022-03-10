import {KeyboardArrowDown, PlaylistRemove, Add as AddIcon, Clear as ClearIcon} from "@mui/icons-material";
import {
    AppBar,
    Box,
    Chip,
    Dialog,
    DialogContent,
    IconButton,
    Stack,
    StackProps,
    Toolbar,
    Typography
} from "@mui/material";
import React, {useMemo, useState} from "react";
import { Transition } from "./AppDialog";
import { DrawerSpacer } from "./Drawer";
import {PlayerWidget, usePlayerAlbumObj} from "./Player";
import {setState, setStorage, useStorage, useStore} from "./state";
import { PLAYER_DIALOG_ZI } from "./zIndices";
import {motion} from "framer-motion";
import {prompt} from "./DialogProvider";

export default function PlayerDialog() {
    const {
        playerDialogOpen,
        playerAlbum,
        playerDialogAlbum
    } = useStore(["playerDialogOpen", "playerAlbum", "playerDialogAlbum", "playerTrack", "playerState"]);
    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({
        playerAlbum: playerDialogAlbum, albums
    });

    return !playerAlbumObj ? null : (
        <Dialog
            fullScreen
            open={playerDialogOpen}
            keepMounted
            onClose={() => setState({ playerDialogOpen: false })}
            TransitionComponent={Transition}
            sx={{
                zIndex: PLAYER_DIALOG_ZI
            }}
        >
            <AppBar sx={{
                position: "relative"
            }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => setState({ playerDialogOpen: false })}
                        aria-label="close player dialog"
                    >
                        <KeyboardArrowDown />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <DialogContent>
                <Player playerAlbum={playerDialogAlbum!} />
            </DialogContent>
            {playerDialogAlbum !== playerAlbum && (
                <DrawerSpacer />
            )}
        </Dialog>
    )
}

export function Player({ playerAlbum, ...stackProps }: {
    playerAlbum: string
} & StackProps) {
    const {
        // TODO is this necessary?
        playerTrack
    } = useStore(["playerDialogOpen", "playerAlbum", "playerDialogAlbum", "playerTrack", "playerState"]);
    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({
        playerAlbum, albums
    });

    if(!playerAlbumObj) {
        throw new Error("Trying to render player for nonexistent album");
    }

    return (
        <Stack direction="column">

            <Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{
                        width: 150,
                        height: 150,
                        objectFit: "cover",
                        overflow: "hidden",
                        flexShrink: 0,
                        borderRadius: "8px",
                        backgroundColor: "rgba(0,0,0,0.08)",
                        "& > img": {
                            width: "100%"
                        }
                    }}>
                        <img alt="Album artwork" src={playerAlbumObj.data.imageUrl} />
                    </Box>

                    <Box sx={{ ml: 1.5, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>{playerAlbumObj.data.artist}</Typography>
                        <Typography sx={{
                            fontWeight: "bold",
                            fontSize: "1.2rem"
                        }}>{playerAlbumObj.data.title}</Typography>
                        {playerTrack !== null && <Typography letterSpacing={-0.25} sx={{
                            fontSize: "1.1rem"
                        }}>
                            {playerAlbumObj.data.tracks[playerTrack].title}
                        </Typography>}
                    </Box>
                </Box>
                <PlayerWidget album={playerAlbum} />
            </Box>


            {/* <Box
                        component="img"
                        src={playerAlbumObj.data.imageUrl}
                        sx={{
                            width: "100%"
                        }}
                    /> */}
            {/* <Box sx={{
                        "& > *": {
                            width: "100%",
                            textAlign: "center"
                        }
                    }}>
                        <Typography variant="h6">
                            {playerAlbumObj.data.title}
                        </Typography>
                        <Typography variant="body1">
                            {playerAlbumObj.data.artist}
                        </Typography>
                    </Box>

                    <Player /> */}


            <Typography variant="h6">Description</Typography>

            <Typography variant="body1" sx={{
                whiteSpace: "pre-line"
            }}>
                {playerAlbumObj.data.description}
            </Typography>

            <TagEditor album={playerAlbum!} />

            <Typography variant="body2" sx={{
                marginTop: "1rem"
            }}>
                Released {playerAlbumObj.data.releaseDate}
            </Typography>
        </Stack>
    )
}

function TagEditor({ album }: {
    album: string
}) {
    const { albums } = useStorage(["albums"]);
    const albumObj = usePlayerAlbumObj({ playerAlbum: album, albums });
    const tags = useMemo(() => albumObj!.tags.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())), [albumObj]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    function updateStoredTags(newTags: string[]) {
        setStorage({
            albums: [
                ...albums.filter(a => a.data.url !== album),
                {
                    ...albumObj!,
                    tags: newTags
                }
            ]
        });
    }

    return (
        <>
            <Box sx={{
                marginTop: "0.5rem",
                display: "flex"
            }}>
                <Typography variant="h6">Tags</Typography>
                <IconButton disabled={selectedTags.length === 0} sx={{
                    marginLeft: "auto"
                }} component={motion.button} animate={{
                    opacity: selectedTags.length > 0 ? 1 : 0
                }} onClick={() => {
                    // update tags of album object
                    const newTags = tags.filter(tag => !selectedTags.includes(tag));
                    updateStoredTags(newTags);
                    setSelectedTags([]);
                }}>
                    <PlaylistRemove />
                </IconButton>
                <IconButton disabled={selectedTags.length === 0} component={motion.button} animate={{
                    opacity: selectedTags.length > 0 ? 1 : 0
                }} onClick={() => {
                    setSelectedTags([]);
                }}>
                    <ClearIcon />
                </IconButton>
            </Box>

            <Box component={motion.div} sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px"
            }}>
                {tags.map((tag, i) => (
                    <Chip
                        component={motion.div}
                        layout
                        // layoutId={`playerdialogtag-${tag}`}
                        key={i}
                        label={tag}
                        variant="outlined"
                        onContextMenu={e => {
                            e.preventDefault();
                            setSelectedTags([tag]);
                        }}
                        onClick={() => {
                            if(selectedTags.length === 0) return;
                            if (selectedTags.includes(tag)) {
                                setSelectedTags(selectedTags.filter(t => t !== tag));
                            } else {
                                setSelectedTags([...selectedTags, tag]);
                            }
                        }}
                        animate={{
                            backgroundColor: selectedTags.includes(tag) ? "#ebebeb" : "transparent"
                        }}
                    />
                ))}
                <Chip
                    component={motion.button}
                    layout
                    // layoutId={`playerdialogtag_new`}
                    label="Add tag..."
                    icon={<AddIcon />}
                    onClick={async () => {
                        const newTag = await prompt({
                            title: "Add tag",
                            text: "Enter new tag name"
                        });
                        if(newTag) updateStoredTags([...tags, newTag]);
                    }}
                />
            </Box>
        </>
    )
}