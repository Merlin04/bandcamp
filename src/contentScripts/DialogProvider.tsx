import React, {ReactElement} from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    DialogContentText,
    Button,
    TextField,
    RadioGroup, Radio, FormControlLabel, CircularProgress
} from "@mui/material";
import {GENERIC_DIALOG_ZI} from "./zIndices";

type DialogText = string | ReactElement;
type DialogStrings = string | {
    title?: DialogText;
    text?: DialogText;
};

type AlertFn = (message: DialogStrings) => Promise<void>;
type ConfirmFn = (message: DialogStrings) => Promise<boolean>;
type PromptOptions = {
    multiline?: boolean;
}
type PromptArgs = [message: DialogStrings, options?: PromptOptions];
type PromptFn = (...args: PromptArgs) => Promise<string | null>;
type ChooseFn = (message: DialogStrings, options: DialogText[]) => Promise<number | null>;
type LoadFn = () => () => void;

export let alert: AlertFn = null!;
export let confirm: ConfirmFn = null!;
export let prompt: PromptFn = null!;
export let choose: ChooseFn = null!;
export let load: LoadFn = null!;

enum DialogType {
    Alert,
    Confirm,
    Prompt,
    Choose,
    Load
}

type FnArgs = [message: DialogStrings] | [message: DialogStrings, options: DialogText[]] | PromptArgs;

export default function DialogProvider(props: React.PropsWithChildren<{}>) {
    const [type, setType] = React.useState<DialogType | null>(null);
    const [args, setArgs] = React.useState<FnArgs | null>(null);
    const [resolve, setResolve] = React.useState<((value: any) => void) | null>(null);

    const functionFactory = (type: DialogType) => (...args: FnArgs) => {
        setType(type);
        setArgs(args);
        return new Promise<any>((resolve) => {
            setResolve(() => (val: any) => {
                setType(null);
                setArgs(null);
                resolve(val);
            });
        });
    }

    alert = functionFactory(DialogType.Alert);
    confirm = functionFactory(DialogType.Confirm);
    prompt = functionFactory(DialogType.Prompt);
    choose = functionFactory(DialogType.Choose);
    load = () => {
        setType(DialogType.Load);
        setArgs([] as any);
        setResolve(true as any);
        return () => {
            setType(null);
            setArgs(null);
        };
    }

    const renderDialog = () => {
        if (type === null || args === null || resolve === null) {
            return null;
        }
        switch (type) {
            case DialogType.Alert:
                // @ts-expect-error
                return <AlertDialog args={args} resolve={resolve} />;
            case DialogType.Confirm:
                // @ts-expect-error
                return <ConfirmDialog args={args} resolve={resolve} />;
            case DialogType.Prompt:
                // @ts-expect-error
                return <PromptDialog args={args} resolve={resolve} />;
            case DialogType.Choose:
                // @ts-expect-error
                return <ChooseDialog args={args} resolve={resolve} />;
            case DialogType.Load:
                return <LoadDialog />;
            default:
                return null;
        }
    };

    return (
        <>
            {renderDialog()}
            {props.children}
        </>
    );
}

function AlertDialog({args, resolve}: {args: [DialogStrings], resolve: () => void}) {
    const [open, setOpen] = React.useState(true);

    const close = () => {
        setOpen(false);
        resolve();
    };

    return (
        <Dialog open={open} onClose={close} sx={{
            zIndex: GENERIC_DIALOG_ZI
        }}>
            <DialogTitle>{typeof args[0] === "string" ? "Alert" : args[0].title === undefined ? "Alert" : args[0].title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{typeof args[0] === "string" ? args[0] : args[0].text}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={close}>OK</Button>
            </DialogActions>
        </Dialog>
    );
}

function ConfirmDialog({args, resolve}: {args: [DialogStrings], resolve: (value: boolean) => void}) {
    const [open, setOpen] = React.useState(true);

    const close = (value: boolean) => {
        setOpen(false);
        resolve(value);
    };

    return (
        <Dialog open={open} onClose={close} sx={{
            zIndex: GENERIC_DIALOG_ZI
        }}>
            <DialogTitle>{typeof args[0] === "string" ? "Confirm" : args[0].title === undefined ? "Confirm" : args[0].title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{typeof args[0] === "string" ? args[0] : args[0].text}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => close(false)}>Cancel</Button>
                <Button onClick={() => close(true)} variant="contained">OK</Button>
            </DialogActions>
        </Dialog>
    );
}

function PromptDialog({args, resolve}: {args: PromptArgs, resolve: (value: string | null) => void}) {
    const [open, setOpen] = React.useState(true);

    const close = (val: string | null) => {
        setOpen(false);
        resolve(val);
    };

    return (
            <Dialog open={open} onClose={() => close(null)} sx={{
                zIndex: GENERIC_DIALOG_ZI
            }}>
                <form onSubmit={e => {
                    e.preventDefault();
                    //@ts-expect-error
                    close(e.target.prompt.value);
                }}>
                    <DialogTitle>{typeof args[0] === "string" ? "Prompt" : args[0].title === undefined ? "Prompt" : args[0].title}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>{typeof args[0] === "string" ? args[0] : args[0].text}</DialogContentText>
                        <TextField name="prompt" multiline={args[1]?.multiline} autoFocus margin="dense" type="text" fullWidth />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => close(null)}>Cancel</Button>
                        <Button type="submit" variant="contained">OK</Button>
                    </DialogActions>
                </form>
            </Dialog>
    );
}

function ChooseDialog({args, resolve}: {args: [DialogStrings, DialogText[]], resolve: (value: number | null) => void}) {
    const [open, setOpen] = React.useState(true);
    const [value, setValue] = React.useState(0);

    const close = (sendVal: boolean) => {
        setOpen(false);
        resolve(sendVal ? value : null);
    };

    return (
        <Dialog open={open} onClose={close} sx={{
            zIndex: GENERIC_DIALOG_ZI
        }}>
            <DialogTitle>{typeof args[0] === "string" ? "Choose" : args[0].title === undefined ? "Choose" : args[0].title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{typeof args[0] === "string" ? args[0] : args[0].text}</DialogContentText>
                <RadioGroup value={value} onChange={(e) => setValue(Number(e.target.value))}>
                    {args[1].map((text, i) => (
                        <FormControlLabel key={i} value={i} control={<Radio />} label={text} />
                    ))}
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => close(false)}>Cancel</Button>
                <Button onClick={() => close(true)} variant="contained">OK</Button>
            </DialogActions>
        </Dialog>
    );
}

function LoadDialog() {
    return (
        <Dialog open sx={{
            zIndex: GENERIC_DIALOG_ZI
        }}>
            <DialogContent>
                <CircularProgress />
            </DialogContent>
        </Dialog>
    )
}