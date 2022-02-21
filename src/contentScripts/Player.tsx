import {Pause, PlayArrow, SkipNext, SkipPrevious} from "@mui/icons-material";
import {
    Box,
    IconButton,
    IconButtonProps,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Slider,
    styled,
    SvgIconProps,
    Typography
} from "@mui/material";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {Album, PlayerState, setState, useStorage, useStore} from "./state";
import {createEvent} from "niue";

const [useOnSetAudioTime, dispatchSetAudioTime] = createEvent<number>();

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

// This is an audio player which controls an audio element and has a play/pause button, seek bar, time display, and next/previous track buttons.
export default function PlayerProvider() {
    const ref = useRef<HTMLAudioElement>(null);
    const { playerState, playerAlbum, playerTrack } = useStore([
        "playerState",
        "playerAlbum",
        "playerTrack"
    ]);
    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });

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

            setState({
                audioCurrentTime: 0
            });

            ref.current.src = track.url;
            playerState === PlayerState.PLAYING ? ref.current.play() : ref.current.load();
        }
    }, [playerAlbumObj, playerTrack]);

    useOnSetAudioTime((value) => {
        if(ref.current) ref.current.currentTime = value;
    }, [ref.current]);

    return playerState !== PlayerState.INACTIVE ? (
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
                    setState({
                        audioCurrentTime: (e.target as HTMLAudioElement).currentTime
                    });
                }}
                style={{
                    display: "none"
                }}
            />
            {/*{playerAlbumObj && playerTrack !== null && (*/}
            {/*    <PlayerWidget album={playerDialogAlbum} />*/}
            {/*)}*/}
        </>
    ) : null;
}

export function PlayerWidget({ album }: { album: string }) {
    const { playerState, playerAlbum, playerTrack, audioCurrentTime } = useStore([
        "playerState",
        "playerAlbum",
        "playerTrack",
        "audioCurrentTime"
    ]);
    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({
        playerAlbum: album,
        albums
    });

    const fake = album !== playerAlbum;
    const track = fake ? 0 : playerTrack!;

    const [overrideSliderVal, setOverrideSliderVal] = useState<false | number>(false);
    const [disableOverrideOnNextUpdate, setDisableOverrideOnNextUpdate] = useState(false);

    const sliderPos = overrideSliderVal === false ? (fake ? 0 : audioCurrentTime) : overrideSliderVal;

    useEffect(() => {
        if(disableOverrideOnNextUpdate) {
            setOverrideSliderVal(false);
            setDisableOverrideOnNextUpdate(false);
        }
    }, [audioCurrentTime]);

    function unfake(track?: number) {
        setState({
            playerState: PlayerState.PLAYING,
            playerAlbum: album,
            playerTrack: track ?? 0
        });
    }

    return (
        <>
            <Slider
                aria-label="seek"
                size="small"
                value={sliderPos}
                min={0}
                max={playerAlbumObj!.data.tracks[track].duration}
                step={1}
                onChange={(_e, value) => {
                    setOverrideSliderVal(value as number);
                }}
                onChangeCommitted={(_e, value) => {
                    if(fake) {
                        unfake();
                    }
                    dispatchSetAudioTime(value as number);
                    setDisableOverrideOnNextUpdate(true);
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
                <TinyText>{formatDuration(sliderPos)}</TinyText>
                <TinyText>
                    {formatDuration(
                        playerAlbumObj!.data.tracks[track].duration
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
                    fakeAlbum={fake ? album : undefined}
                >
                    <PlayButton
                        iconProps={{
                            sx: {
                                fontSize: "3rem"
                            }
                        }}
                        fakeAlbum={fake ? album : undefined}
                    />
                </TrackControls>
            </Box>

            <List dense>
                {playerAlbumObj!.data.tracks.map((track, i) => {
                    const trackIsPlaying =
                        playerAlbum === album &&
                        playerTrack === i &&
                        playerState === PlayerState.PLAYING;

                    return (
                        <ListItem key={i} disablePadding>
                            <ListItemButton
                                role={undefined}
                                dense
                                aria-label={`${trackIsPlaying ? "pause" : "play"} track ${i + 1}`}
                                onClick={() => {
                                    if(fake) { unfake(i) } else {
                                        setState({
                                            playerTrack: i,
                                            playerState: trackIsPlaying ? PlayerState.PAUSED : PlayerState.PLAYING
                                        });
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    {trackIsPlaying ? <Pause/> :
                                        <PlayArrow/>}
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
                    );
                })}
            </List>
        </>
    );
}

export function PlayButton({
    iconProps,
    sx,
    fakeAlbum,
    ...buttonProps
}: IconButtonProps & {
    iconProps?: SvgIconProps;
    fakeAlbum?: string
}) {
    const { playerState } = useStore(["playerState"]);
    const state = fakeAlbum ? PlayerState.PAUSED : playerState;

    return (
        <IconButton
            aria-label={state === PlayerState.PLAYING ? "pause" : "play"}
            onClick={() => {
                if(fakeAlbum) {
                    setState({
                        playerState: PlayerState.PLAYING,
                        playerAlbum: fakeAlbum,
                        playerTrack: 0
                    })
                } else {
                    setState({
                        playerState:
                            state === PlayerState.PLAYING
                                ? PlayerState.PAUSED
                                : PlayerState.PLAYING
                    });
                }
            }}
            sx={{
                color:
                    state === PlayerState.PLAYING
                        ? "primary"
                        : "secondary",
                ...sx
            }}
            {...buttonProps}
        >
            {state === PlayerState.PLAYING ? (
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
    fakeAlbum,
    ...buttonProps
}: IconButtonProps & {
    iconProps?: SvgIconProps;
    fakeAlbum?: string;
}) {
    const { playerTrack, playerAlbum } = useStore([
        "playerTrack",
        "playerAlbum"
    ]);
    const { albums } = useStorage(["albums"]);
    const album = fakeAlbum ?? playerAlbum
    const track = fakeAlbum ? 0 : playerTrack
    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum: album, albums });

    return (
        <>
            <IconButton
                aria-label="previous track"
                disabled={track === 0}
                onClick={() => {
                    setState({
                        playerTrack: track! - 1
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
                    track === playerAlbumObj!.data.tracks.length - 1
                }
                onClick={() => {
                    if(fakeAlbum) {
                        setState({
                            playerAlbum: album,
                            playerTrack: 1
                        });
                    } else {
                        setState({
                            playerTrack: track! + 1
                        });
                    }
                }}
                {...buttonProps}
            >
                <SkipNext {...iconProps} />
            </IconButton>
        </>
    );
}
