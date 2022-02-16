import { Pause, PlayArrow, SkipNext, SkipPrevious } from "@mui/icons-material";
import {
    Box,
    IconButton,
    IconButtonProps,
    Slider,
    styled,
    SvgIconProps,
    Typography
} from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Album, PlayerState, setState, useStorage, useStore } from "./state";

const padNumber = (n: number) => (n < 10 ? `0${n}` : n);

export function formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);

    return `${padNumber(minutes)}:${padNumber(seconds)}`;
}

export const usePlayerAlbumObj = ({
    playerAlbum,
    albums
}: {
    playerAlbum: string | null;
    albums: Album[];
}): Album | undefined =>
    useMemo(
        () =>
            playerAlbum !== null
                ? albums.find((a) => a.data.url === playerAlbum)
                : undefined,
        [playerAlbum, albums]
    );

// https://mui.com/components/slider/#music-player
const TinyText = styled(Typography)({
    fontSize: "0.75rem",
    opacity: 0.38,
    fontWeight: 500,
    letterSpacing: 0.2
});

let audioUpdateTime = true;

// This is an audio player which controls an audio element and has a play/pause button, seek bar, time display, and next/previous track buttons.
export default function Player() {
    const ref = useRef<HTMLAudioElement>(null);
    const { playerState, playerAlbum, playerTrack } = useStore([
        "playerState",
        "playerAlbum",
        "playerTrack"
    ]);
    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });

    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (playerState === PlayerState.PLAYING) {
            if (ref.current) {
                ref.current.play();
            }
        } else if (playerState === PlayerState.PAUSED) {
            if (ref.current) {
                ref.current.pause();
            }
        } else {
            if (ref.current) {
                ref.current.pause();
            }
            setState({ playerAlbum: null });
        }
    }, [playerState]);

    useEffect(() => {
        if (ref.current && playerAlbumObj && playerTrack !== null) {
            const track = playerAlbumObj.data.tracks[playerTrack];
            if (!track) return;

            setCurrentTime(0);

            ref.current.src = track.url;
            playerState === PlayerState.PLAYING ? ref.current.play() : ref.current.load();
        }
    }, [playerAlbumObj, playerTrack]);

    return (
        <>
            <audio
                ref={ref}
                onEnded={() => {
                    if (playerTrack === null || !playerAlbumObj) return;

                    if (playerTrack === playerAlbumObj.data.tracks.length - 1) {
                        setState({
                            playerTrack: 0,
                            playerState: PlayerState.PAUSED
                        });
                    } else {
                        setState({ playerTrack: playerTrack + 1 });
                    }
                }}
                onTimeUpdate={(e) => {
                    if (audioUpdateTime)
                        setCurrentTime(
                            (e.target as HTMLAudioElement).currentTime
                        );
                }}
                style={{
                    display: "none"
                }}
            />
            {playerAlbumObj && playerTrack !== null && (
                <>
                    <Slider
                        aria-label="seek"
                        size="small"
                        value={currentTime}
                        min={0}
                        max={playerAlbumObj.data.tracks[playerTrack].duration}
                        step={1}
                        onChange={(_e, value) => {
                            audioUpdateTime = false;
                            setCurrentTime(value as number);
                        }}
                        onChangeCommitted={(_e, value) => {
                            audioUpdateTime = true;
                            if (ref.current) {
                                ref.current.currentTime = value as number;
                            }
                        }}
                        sx={{
                            // color: "rgba(0,0,0,0.87)",
                            height: 4,
                            "& .MuiSlider-thumb": {
                                width: 8,
                                height: 8,
                                transition:
                                    "0.3s cubic-bezier(.47,1.64,.41,.8)",
                                "&:before": {
                                    boxShadow: "0 2px 12px 0 rgba(0,0,0,0.4)"
                                },
                                "&:hover, &.Mui-focusVisible": {
                                    boxShadow:
                                        "0px 0px 0px 8px rgb(0 0 0 / 16%)"
                                },
                                "&.Mui-active": {
                                    width: 20,
                                    height: 20
                                }
                            },
                            "& .MuiSlider-rail": {
                                opacity: 0.28
                            }
                        }}
                    />
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mt: -2
                        }}
                    >
                        <TinyText>{formatDuration(currentTime)}</TinyText>
                        <TinyText>
                            {formatDuration(
                                playerAlbumObj.data.tracks[playerTrack].duration
                            )}
                        </TinyText>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mt: -1
                        }}
                    >
                        <TrackControls
                            iconProps={{
                                fontSize: "large"
                            }}
                        >
                            <PlayButton
                                iconProps={{
                                    sx: {
                                        fontSize: "3rem"
                                    }
                                }}
                            />
                        </TrackControls>
                    </Box>
                </>
            )}
        </>
    );
}

export function PlayButton({
    iconProps,
    sx,
    ...buttonProps
}: IconButtonProps & {
    iconProps?: SvgIconProps;
}) {
    const { playerState } = useStore(["playerState"]);

    return (
        <IconButton
            aria-label={playerState === PlayerState.PLAYING ? "pause" : "play"}
            onClick={() => {
                setState({
                    playerState:
                        playerState === PlayerState.PLAYING
                            ? PlayerState.PAUSED
                            : PlayerState.PLAYING
                });
            }}
            sx={{
                color:
                    playerState === PlayerState.PLAYING
                        ? "primary"
                        : "secondary",
                ...sx
            }}
            {...buttonProps}
        >
            {playerState === PlayerState.PLAYING ? (
                <Pause {...iconProps} />
            ) : (
                <PlayArrow {...iconProps} />
            )}
        </IconButton>
    );
}

export function TrackControls({
    children,
    iconProps,
    ...buttonProps
}: IconButtonProps & {
    iconProps?: SvgIconProps;
}) {
    const { playerTrack, playerAlbum } = useStore([
        "playerTrack",
        "playerAlbum"
    ]);
    const { albums } = useStorage(["albums"]);
    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });

    return (
        <>
            <IconButton
                aria-label="previous track"
                disabled={playerTrack === 0}
                onClick={() => {
                    setState({
                        playerTrack: playerTrack! - 1
                    });
                }}
                {...buttonProps}
            >
                <SkipPrevious {...iconProps} />
            </IconButton>
            {children}
            <IconButton
                aria-label="next track"
                disabled={
                    playerTrack === playerAlbumObj!.data.tracks.length - 1
                }
                onClick={() => {
                    setState({
                        playerTrack: playerTrack! + 1
                    });
                }}
                {...buttonProps}
            >
                <SkipNext {...iconProps} />
            </IconButton>
        </>
    );
}
