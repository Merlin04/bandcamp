import { KeyboardArrowDown, Pause, PlayArrow } from "@mui/icons-material";
import { AppBar, Box, Dialog, DialogContent, IconButton, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography } from "@mui/material";
import React, { useMemo } from "react";
import { Transition } from "./AppDialog";
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
            // disablePortal
            // container={() => window._BANDCAMP_COLLECTOR_SHADOW_DOM as unknown as HTMLElement}
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
                <Box
                    component="img"
                    src={playerAlbumObj.data.imageUrl}
                    sx={{
                        width: "100%"
                    }}
                />
                <Typography>
                    {playerAlbumObj.data.title} by <b>{playerAlbumObj.data.artist}</b>
                </Typography>

                <Player />

                <List dense>
                    {playerAlbumObj.data.tracks.map((track, i) => (
                        <ListItem key={i}>
                            <ListItemButton role={undefined} dense>
                                <IconButton
                                    edge="start"
                                    aria-label={`${playerTrack === i && playerState === PlayerState.PLAYING ? "pause" : "play"} track ${i + 1}`}
                                    onClick={() => {
                                        setState({
                                            playerTrack: i,
                                            playerState: playerTrack === i && playerState === PlayerState.PLAYING ? PlayerState.PAUSED : PlayerState.PLAYING
                                        });
                                    }}
                                >
                                    {playerTrack === i && playerState === PlayerState.PLAYING ? <Pause /> : <PlayArrow />}
                                </IconButton>
                            </ListItemButton>
                            <ListItemText>
                                <Typography variant="body1" sx={{
                                    color: "textSecondary"
                                }}>
                                    {`${i + 1}. `}
                                </Typography>
                                <Typography variant="body1">{track.title}</Typography>
                                <Typography variant="body1" sx={{
                                    color: "textSecondary"
                                }}>
                                    {formatDuration(track.duration)}
                                </Typography>
                            </ListItemText>
                        </ListItem>
                    ))}
                </List>

                <Typography>
                    {playerAlbumObj.data.description}
                </Typography>

                <Typography variant="body2">
                    {playerAlbumObj.data.releaseDate}
                </Typography>
            </DialogContent>
        </Dialog>
    )
}