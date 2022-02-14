import { Pause, PlayArrow, SkipNext, SkipPrevious } from "@mui/icons-material";
import { Box, IconButton, IconButtonProps, IconProps, Slider, styled, SvgIconProps, Typography } from "@mui/material";
import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { Album, PlayerState, setState, useStorage, useStore } from "./state";

const padNumber = (n: number) => n < 10 ? `0${n}` : n;

export function formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);

    return `${padNumber(minutes)}:${padNumber(seconds)}`;
}

export const usePlayerAlbumObj = ({
    playerAlbum,
    albums
}: {
    playerAlbum: string | null,
    albums: Album[]
}): Album | undefined =>
    useMemo(() => playerAlbum !== null ? albums.find(a => a.data.url === playerAlbum) : undefined, [playerAlbum, albums]);

// https://mui.com/components/slider/#music-player
const TinyText = styled(Typography)({
    fontSize: '0.75rem',
    opacity: 0.38,
    fontWeight: 500,
    letterSpacing: 0.2,
});

let audioUpdateTime = false;

// This is an audio player which controls an audio element and has a play/pause button, seek bar, time display, and next/previous track buttons.
export default function Player() {
    const ref = useRef<HTMLAudioElement>(null);
    const {
        playerState,
        playerAlbum,
        playerTrack
    } = useStore(["playerState", "playerAlbum", "playerTrack"]);
    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });

    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if(playerState === PlayerState.PLAYING) {
            if(ref.current) {
                ref.current.play();
            }
        } else if(playerState === PlayerState.PAUSED) {
            if(ref.current) {
                ref.current.pause();
            }
        } else {
            if(ref.current) {
                ref.current.pause();
            }
            setState({ playerAlbum: null });
        }
    }, [playerState]);

    useEffect(() => {
        if(ref.current && playerAlbumObj && playerTrack !== null) {
            const track = playerAlbumObj.data.tracks[playerTrack];
            if(!track) return;

            ref.current.src = track.url;
            ref.current.load();
        }
    }, [playerAlbumObj, playerTrack]);

    return (
        <>
            <audio
                ref={ref}
                onEnded={() => {
                    if(playerTrack === null || !playerAlbumObj) return;

                    if(playerTrack === playerAlbumObj.data.tracks.length - 1) {
                        setState({
                            playerTrack: 0,
                            playerState: PlayerState.PAUSED
                        });
                    } else {
                        setState({ playerTrack: playerTrack + 1 });
                    }
                }}
                onTimeUpdate={(e) => {
                    if(audioUpdateTime) setCurrentTime((e.target as HTMLAudioElement).currentTime);
                }}
                style={{
                    display: "none"
                }}
            />
            {playerAlbumObj && playerTrack !== null && (
                <Box sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center"
                }}>
                    {/* seek */}
                    {/* <Typography variant="body2" sx={{
                        color: "textSecondary"
                    }}>
                        {formatDuration(currentTime)}
                    </Typography> */}
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
                            if(ref.current) {
                                ref.current.currentTime = value as number;
                            }
                        }}
                    />
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: -2
                    }}>
                        <TinyText>
                            {formatDuration(currentTime)}
                        </TinyText>
                        <TinyText>
                            {formatDuration(playerAlbumObj.data.tracks[playerTrack].duration)}
                        </TinyText>
                    </Box>
                    {/* <Typography variant="body2" sx={{
                        color: "textSecondary"
                    }}>
                        {formatDuration(playerAlbumObj.data.tracks[playerTrack].duration)}
                    </Typography> */}
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mt: -1
                    }}>
                        <TrackControls iconProps={{
                            fontSize: "large"
                        }}>
                            <PlayButton iconProps={{
                                //@ts-expect-error
                                fontSize: "3rem"
                            }} />
                        </TrackControls>
                    </Box>
                </Box>
            )}
        </>
    );
}

export function PlayButton({ iconProps, sx, ...buttonProps }: IconButtonProps & {
    iconProps?: SvgIconProps
}) {
    const { playerState } = useStore(["playerState"]);

    return (
        <IconButton
            aria-label={playerState === PlayerState.PLAYING ? "pause" : "play"}
            onClick={() => {
                setState({
                    playerState: playerState === PlayerState.PLAYING ? PlayerState.PAUSED : PlayerState.PLAYING
                });
            }}
            sx={{
                color: playerState === PlayerState.PLAYING ? "primary" : "secondary",
                ...sx
            }}
            {...buttonProps}
        >
            {playerState === PlayerState.PLAYING ? <Pause {...iconProps} /> : <PlayArrow {...iconProps} />}
        </IconButton>
    );
}

export function TrackControls({ children, iconProps, ...buttonProps }: IconButtonProps & {
    iconProps?: SvgIconProps
}) {
    const { playerTrack, playerAlbum } = useStore(["playerTrack", "playerAlbum"]);
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
                disabled={playerTrack === playerAlbumObj!.data.tracks.length - 1}
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