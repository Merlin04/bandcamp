import { Box, Typography } from "@mui/material";
import React from "react";
import { PlayButton, TrackControls, usePlayerAlbumObj } from "./Player";
import { useStorage, useStore } from "./state";

export default function MiniPlayer() {
    const {
        playerAlbum,
        playerTrack
    } = useStore(["playerState", "playerAlbum", "playerTrack"]);

    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });

    return (playerAlbumObj && playerTrack !== null) ? (
        <Box sx={{
            width: "100%",
            height: "150px",
            display: "flex",
            justifyContent: "center"
        }}>
            <Box
                component="img"
                src={playerAlbumObj.data.imageUrl}
                sx={{
                    height: "100%"
                }}
            />
            <Box sx={{
                flex: 1,
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap"
            }}>
                <Typography variant="body1">
                    {playerAlbumObj.data.tracks[playerTrack].title}
                </Typography>
                <Typography variant="body2">
                    <b>{playerAlbumObj.data.title}</b> by {playerAlbumObj.data.artist}
                </Typography>
            </Box>
            <PlayButton />
            <TrackControls />
        </Box>
    ) : null;
}