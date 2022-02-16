import { KeyboardArrowDown, Pause, PlayArrow } from "@mui/icons-material";
import { AppBar, Box, Dialog, DialogContent, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Typography } from "@mui/material";
import React, { useMemo } from "react";
import { Transition } from "./AppDialog";
import { DrawerSpacer } from "./Drawer";
import Player, { formatDuration, usePlayerAlbumObj } from "./Player";
import { Album, PlayerState, setState, useStorage, useStore } from "./state";
import { PLAYER_DIALOG_ZI } from "./zIndices";

export default function PlayerDialog() {
    const {
        playerDialogOpen,
        playerAlbum,
        playerTrack,
        playerState
    } = useStore(["playerDialogOpen", "playerAlbum", "playerTrack", "playerState"]);
    const { albums } = useStorage(["albums"]);

    console.log("Player dialog render", {
        playerDialogOpen,
        playerAlbum,
        playerTrack,
        playerState
    })

    const playerAlbumObj = usePlayerAlbumObj({
        playerAlbum, albums
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
            // BackdropComponent={() => <></>}
            // hideBackdrop
            // disableEnforceFocus
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
                        <Player />
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

                    <List dense>
                        {playerAlbumObj.data.tracks.map((track, i) => (
                            <ListItem key={i} disablePadding>
                                <ListItemButton
                                    role={undefined}
                                    dense
                                    aria-label={`${playerTrack === i && playerState === PlayerState.PLAYING ? "pause" : "play"} track ${i + 1}`}
                                    onClick={() => {
                                        setState({
                                            playerTrack: i,
                                            playerState: playerTrack === i && playerState === PlayerState.PLAYING ? PlayerState.PAUSED : PlayerState.PLAYING
                                        });
                                    }}                                    
                                >
                                    <ListItemIcon>
                                        {playerTrack === i && playerState === PlayerState.PLAYING ? <Pause /> : <PlayArrow />}
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography component="span" variant="body1" sx={{
                                            color: "textSecondary"
                                        }}>
                                            {`${i + 1}. `}
                                        </Typography>
                                        <Typography component="span" variant="body1">{track.title}</Typography>
                                        <Typography component="span" variant="body1" color="textSecondary" sx={{
                                            marginLeft: "0.5rem"
                                        }}>
                                            {formatDuration(track.duration)}
                                        </Typography>
                                    </ListItemText>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>

                    <Typography variant="h6">Description</Typography>

                    <Typography variant="body1" sx={{
                        whiteSpace: "pre-line"
                    }}>
                        {playerAlbumObj.data.description}
                    </Typography>

                    <Typography variant="body2" sx={{
                        marginTop: "0.5rem"
                    }}>
                        Released {playerAlbumObj.data.releaseDate}
                    </Typography>
                </Stack>
            </DialogContent>
            <DrawerSpacer />
        </Dialog>
    )
}