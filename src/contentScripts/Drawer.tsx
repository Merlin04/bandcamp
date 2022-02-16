import * as React from "react";
import { Global } from "@emotion/react";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import SwipeableDrawer from "./SwipeableDrawer-patched";
import { DRAWER_ZI } from "./zIndices";
import { Paper } from "@mui/material";
import MiniPlayer from "./MiniPlayer";
import { PlayButton, TrackControls, usePlayerAlbumObj } from "./Player";
import { PlayerState, useStorage, useStore } from "./state";

const drawerBleeding = 75;

export const DrawerSpacer = () => {
    const { playerState } = useStore(["playerState"]);
    return playerState !== PlayerState.INACTIVE ? <Box sx={{ height: drawerBleeding, minHeight: drawerBleeding }} /> : null;
}

const Puller = styled(Box)(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: theme.palette.mode === "light" ? grey[300] : grey[900],
    borderRadius: 3,
    position: "absolute",
    top: 8,
    left: "calc(50% - 15px)"
}));

let scrollLocked = false;
type Coords = [number, number];
let scrollFirstCoords: Coords | null = null;

export default function SwipeableEdgeDrawer() {
    const [open, setOpen] = React.useState(false);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    const drawerBoxRef = React.useRef<HTMLDivElement>(null);
    const drawerRef = React.useRef<HTMLDivElement>(null);

    const [disableBoxScroll, setDisableBoxScroll] = React.useState(false);

    return (
        <SwipeableDrawer
            anchor="bottom"
            open={open}
            onClose={toggleDrawer(false)}
            onOpen={toggleDrawer(true)}
            swipeAreaWidth={drawerBleeding}
            disableSwipeToOpen={false}
            ModalProps={{
                keepMounted: true
            }}
            sx={{
                "& .MuiDrawer-paper": {
                    height: `calc(100vh - ${drawerBleeding + 50}px)`
                },
                zIndex: DRAWER_ZI
            }}
            ref={drawerRef}
            SwipeAreaProps={{
                sx: {
                    zIndex: DRAWER_ZI - 1
                },
                // TODO
                // onClick: () => setOpen(true)
            }}
        >
            <Global
                styles={{
                    ".MuiDrawer-root > .MuiPaper-root": {
                        height: `calc(50% - ${drawerBleeding}px)`,
                        overflow: "visible"
                    }
                }}
            />
            <Paper
                elevation={6}
                sx={{
                    position: "absolute",
                    top: -drawerBleeding /*+ 1*/ /* no idea why this is necessary but it removes a weird gap */,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    visibility: "visible",
                    right: 0,
                    left: 0,
                    overflow: disableBoxScroll || !open ? "hidden" : "auto",
                    maxHeight: "100vh",
                    minHeight: `calc(100% + ${drawerBleeding}px)`
                }}
                ref={drawerBoxRef}
                onTouchMove={(e) => {
                    const thisCoords: Coords = [
                        e.touches[0].clientX,
                        e.touches[0].clientY
                    ];

                    if (drawerBoxRef.current?.scrollTop !== 0) {
                        // console.log("Drawer scroll isn't at top, blocking");
                        e.stopPropagation();
                    } else if (!scrollFirstCoords) {
                        // console.log("Setting initial reference coordinates");
                        scrollFirstCoords = thisCoords;
                        e.stopPropagation();
                    } else if (
                        thisCoords[0] === scrollFirstCoords[0] &&
                        thisCoords[1] === scrollFirstCoords[1]
                    ) {
                        // console.log("coordinates same as the reference, blocking");
                        e.stopPropagation();
                    } else if (thisCoords[1] > scrollFirstCoords[1]) {
                        // console.log("Scroll up detected, locking");
                        // We're scrolling "up" (sliding the drawer down)
                        scrollLocked = true;
                        setDisableBoxScroll(true);
                    } else if (
                        (drawerRef.current!.querySelector(".MuiBackdrop-root") as HTMLElement)
                            .style.opacity === "1"
                    ) {
                        // The thing is all the way at the top
                        scrollLocked = false;
                        scrollFirstCoords = null;
                        setDisableBoxScroll(false);
                    } else if (!scrollLocked) {
                        // console.log("Scroll blocking (default case)");
                        e.stopPropagation();
                    }
                }}
                onTouchEnd={() => {
                    scrollLocked = false;
                    scrollFirstCoords = null;
                    setDisableBoxScroll(false);
                }}
            >
                <Puller />

                <DrawerContents open={open} />

                {/* <Typography sx={{ p: 2, color: "text.secondary" }}>
                    51 resultstsratrs
                </Typography> */}
                {/* <Skeleton variant="rectangular" height="200vh" /> */}
            </Paper>
        </SwipeableDrawer>
        // </Root>
    );
}

function DrawerContents(props: {
    open: boolean
}) {
    const {
        playerAlbum,
        playerTrack
    } = useStore(["playerState", "playerAlbum", "playerTrack"]);

    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });

    return (playerAlbumObj && playerTrack !== null) ? (
        <Box sx={{
            width: "100%",
            height: drawerBleeding,
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
                whiteSpace: "nowrap",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                marginLeft: "0.5rem"
            }}>
                {/* <Typography variant="body1">
                    {playerAlbumObj.data.tracks[playerTrack].title}
                </Typography>
                <Typography variant="body2">
                    <b>{playerAlbumObj.data.title}</b> by {playerAlbumObj.data.artist}
                </Typography> */}
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {playerAlbumObj.data.artist}
                </Typography>
                <Typography sx={{ fontWeight: "bold" }}>
                    {playerAlbumObj.data.title}
                </Typography>
                <Typography letterSpacing={-0.25}>
                    {playerAlbumObj.data.tracks[playerTrack].title}
                </Typography>
            </Box>
            <PlayButton sx={{
                pointerEvents: "auto"
            }}/>
            <TrackControls sx={{
                pointerEvents: "auto"
            }} />
        </Box>
    ) : null;
}