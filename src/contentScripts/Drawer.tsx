import React, {useEffect, useState} from "react";
import { Global } from "@emotion/react";
import SwipeableDrawer from "./SwipeableDrawer-patched/SwipeableDrawer";
import { DRAWER_ZI } from "./zIndices";
import { Paper, Box, Typography, colors, styled } from "@mui/material";
// import MiniPlayer from "./MiniPlayer";
import { PlayButton, TrackControls, usePlayerAlbumObj } from "./Player";
import { PlayerState, useStorage, useStore } from "./state";
import {motion} from "framer-motion";
import {Player} from "./PlayerDialog";

const { grey } = colors;

const drawerBleeding = 75;

export const DrawerSpacer = () => {
    const { playerState } = useStore(["playerState"]);
    return playerState !== PlayerState.INACTIVE ? <Box sx={{ height: drawerBleeding, minHeight: drawerBleeding }} /> : null;
}

const Puller = styled(Box)(({ theme }) => ({
    width: 30,
    height: 6,
    // #e0e0e0 on a white background but transparent
    backgroundColor: "rgba(193, 193, 193, 0.5)",
    borderRadius: 3,
    position: "absolute",
    top: 8,
    left: "calc(50% - 15px)",
    zIndex: 10
}));

let scrollLocked = false;
type Coords = [number, number];
let scrollFirstCoords: Coords | null = null;

export default function SwipeableEdgeDrawer() {
    const [open, setOpen] = React.useState(false);
    const drawerBoxRef = React.useRef<HTMLDivElement>(null);
    const drawerRef = React.useRef<HTMLDivElement>(null);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
        if(!newOpen) {
            drawerBoxRef.current?.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth"
            });
        }
    };

    const [disableBoxScroll, setDisableBoxScroll] = React.useState(false);
    const [innerDrawerOpen, setInnerDrawerOpen] = React.useState(false);
    const [percentOpen, setPercentOpen] = React.useState(0);

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
            onPercentOpenUpdate={(newPercentOpen: number) => {
                setPercentOpen(newPercentOpen);
                // drawerRef.current?.style.setProperty("--drawer-percent-open", `${newPercentOpen}`);
            }}
            onInnerDrawerOpenUpdate={(newInnerDrawerOpen: boolean) => {
                setInnerDrawerOpen(newInnerDrawerOpen);
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

                <DrawerContents open={open} innerDrawerOpen={innerDrawerOpen} percentOpen={percentOpen} />

                {/* <Typography sx={{ p: 2, color: "text.secondary" }}>
                    51 resultstsratrs
                </Typography> */}
                {/* <Skeleton variant="rectangular" height="200vh" /> */}
            </Paper>
        </SwipeableDrawer>
        // </Root>
    );
}

// function getPercentOpen({ open, innerDrawerOpen, rawPercent }: {
//     open: boolean;
//     innerDrawerOpen: boolean;
//     rawPercent: number
// }) {
//     if(!open && !innerDrawerOpen) {
//         // Fully closed
//         return 0;
//     } else if(!open && innerDrawerOpen) {
//         // Dragging the drawer up (opening)
//         return rawPercent;
//     } else if()
// }

enum DrawerState {
    Closed,
    Opening,
    Open,
    Closing
}

let evenOlderState: DrawerState | undefined = undefined;
let oldPercent = 0;

function DrawerContents({ open, innerDrawerOpen, percentOpen: rawPercent }: {
    open: boolean,
    innerDrawerOpen: boolean,
    percentOpen: number
}) {
    const [drawerState, setDrawerState] = useState<DrawerState>(DrawerState.Closed);

    // Sometimes this gets confused between open and closing but it's fine, percentage should still be accurate enough
    useEffect(() => {
        const newState =
            // Fully closed
            !open && !innerDrawerOpen ? DrawerState.Closed :
            // Dragging the drawer up (opening)
            !open && innerDrawerOpen ? DrawerState.Opening :
            // For some reason it sets it to this before fully open
            open && !innerDrawerOpen ? DrawerState.Opening :
            // Fully open
            // This is a bit weird because the only way we can tell between open and closing is that the first time open
            // and innerDrawerOpen are both true, it will be fully open, then as soon as the percent changes again it means the user is dragging it
            open && innerDrawerOpen && drawerState !== DrawerState.Open && drawerState !== DrawerState.Closing ? DrawerState.Open
            // Dragging the drawer down (closing)
            : DrawerState.Closing;

        console.table({
            open,
            innerDrawerOpen,
            rawPercent,
            evenOlderState: evenOlderState && DrawerState[evenOlderState],
            drawerState: DrawerState[drawerState],
            newState: DrawerState[newState]
        });

        if((
            // This is a weird edge case where it flips to closed before fully opening after the user stops the gesture
            newState === DrawerState.Closed && drawerState === DrawerState.Opening
                // make sure that it's not in this case from clicking to close the drawer
                && evenOlderState !== DrawerState.Open ||
            // And this is a weird one where it flips to opening before fully closing afer the user stops the gesture
            newState === DrawerState.Opening && drawerState === DrawerState.Closing
        ) && rawPercent === oldPercent) {
            // So don't actually update the state
            console.log("Skipping state update");
            return;
        }

        if(newState !== drawerState) {
            evenOlderState = drawerState;
            console.log("Set evenOlderState to ", DrawerState[evenOlderState]);
            setDrawerState(newState);
        }
        oldPercent = rawPercent;
    }, [open, innerDrawerOpen, rawPercent]);

    const percentOpen = {
        [DrawerState.Closed]: 0,
        [DrawerState.Opening]: rawPercent,
        [DrawerState.Open]: 1,
        [DrawerState.Closing]: rawPercent
    }[drawerState];

    const {
        playerAlbum,
        playerTrack
    } = useStore(["playerState", "playerAlbum", "playerTrack"]);

    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });

    // // Calculate new drawer state
    // const newDrawerState =
    //
    // const percentOpen =
    //     // Fully closed
    //     (!open && !innerDrawerOpen) ? 0 :
    //     // Dragging the drawer up (opening)
    //     (!open && innerDrawerOpen) ? rawPercent :
    //     // Fully open, or it's

    return (playerAlbumObj && playerTrack !== null) ? (
        <Box>
            <motion.div style={{
                position: "relative"
            }} animate={{
                bottom: percentOpen * drawerBleeding
            }}>
                <MiniPlayer />
            </motion.div>
            <motion.div style={{
                position: "relative",
                padding: "20px 24px"
            }} animate={{
                top: -percentOpen * drawerBleeding
            }}>
                <Player playerAlbum={playerAlbum!} />
            </motion.div>
        </Box>
    ) : null;
}

function MiniPlayer() {
    const {
        playerAlbum,
        playerTrack
    } = useStore(["playerState", "playerAlbum", "playerTrack"]);

    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });

    return (
        <Box sx={{
            width: "100%",
            height: drawerBleeding,
            display: "flex",
            justifyContent: "center"
        }}>
            <Box
                component="img"
                src={playerAlbumObj!.data.imageUrl}
                sx={{
                    width: drawerBleeding
                }}
            />
            <Box sx={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                flex: 1
            }}>
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
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        {playerAlbumObj!.data.artist}
                    </Typography>
                    <Typography sx={{ fontWeight: "bold" }}>
                        {playerAlbumObj!.data.title}
                    </Typography>
                    <Typography letterSpacing={-0.25}>
                        {playerAlbumObj!.data.tracks[playerTrack!].title}
                    </Typography>
                </Box>
                <PlayButton sx={{
                    pointerEvents: "auto"
                }}/>
                <TrackControls sx={{
                    pointerEvents: "auto"
                }} />
            </Box>
        </Box>
    )
}

/* <Typography variant="body1">
                    {playerAlbumObj.data.tracks[playerTrack].title}
                </Typography>
                <Typography variant="body2">
                    <b>{playerAlbumObj.data.title}</b> by {playerAlbumObj.data.artist}
                </Typography> */

// const mapNum = (num: number, in_min: number, in_max: number, out_min: number, out_max: number) => {
//     return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
// };
//
// // use CSS calc function to do mapping
// const cssMapNum = (num: number | string, in_min: number | string, in_max: number | string, out_min: number | string, out_max: number | string) => {
//     return `calc(calc(calc(calc(${num} - ${in_min}) * calc(${out_max} - ${out_min})) / calc(${in_max} - ${in_min})) + ${out_min})`;
// };
//
// function DrawerContents({ open, innerDrawerOpen }: {
//     // True if the drawer is completely open, false otherwise
//     open: boolean,
//     // If the drawer is anything other than completely closed
//     innerDrawerOpen: boolean
// }) {
//     console.log("drawer open state", { open, innerDrawerOpen });
//     const {
//         playerAlbum,
//         playerTrack
//     } = useStore(["playerState", "playerAlbum", "playerTrack"]);
//
//     const { albums } = useStorage(["albums"]);
//
//     const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });
//
//     return (playerAlbumObj && playerTrack !== null) ? (
//         <Box sx={{
//             width: "100%",
//             height: drawerBleeding,
//             display: "flex",
//             justifyContent: "center"
//         }}>
//             <Box sx={{
//                 width: drawerBleeding,
//                 zIndex: 1
//             }}>
//                 <Box
//                     component="img"
//                     src={playerAlbumObj.data.imageUrl}
//                     sx={{
//                         position: "absolute",
//                         width: open ? "100vw" : !innerDrawerOpen ? drawerBleeding : cssMapNum("var(--drawer-percent-open)", 0, 1, drawerBleeding + "px", "100vw"),
//                     }}
//                 />
//             </Box>
//             <Box sx={{
//                 height: "100%",
//                 display: "flex",
//                 justifyContent: "center",
//                 opacity: open ? 0 : !innerDrawerOpen ? 1 : "calc(1 - var(--drawer-percent-open))",
//                 flex: 1
//             }}>
//                 <Box sx={{
//                     flex: 1,
//                     textOverflow: "ellipsis",
//                     overflow: "hidden",
//                     whiteSpace: "nowrap",
//                     display: "flex",
//                     flexDirection: "column",
//                     justifyContent: "center",
//                     marginLeft: "0.5rem"
//                 }}>
//                     {/* <Typography variant="body1">
//                     {playerAlbumObj.data.tracks[playerTrack].title}
//                 </Typography>
//                 <Typography variant="body2">
//                     <b>{playerAlbumObj.data.title}</b> by {playerAlbumObj.data.artist}
//                 </Typography> */}
//                     <Typography variant="caption" color="text.secondary" fontWeight={500}>
//                         {playerAlbumObj.data.artist}
//                     </Typography>
//                     <Typography sx={{ fontWeight: "bold" }}>
//                         {playerAlbumObj.data.title}
//                     </Typography>
//                     <Typography letterSpacing={-0.25}>
//                         {playerAlbumObj.data.tracks[playerTrack].title}
//                     </Typography>
//                 </Box>
//                 <PlayButton sx={{
//                     pointerEvents: "auto"
//                 }}/>
//                 <TrackControls sx={{
//                     pointerEvents: "auto"
//                 }} />
//             </Box>
//         </Box>
//     ) : null;
// }