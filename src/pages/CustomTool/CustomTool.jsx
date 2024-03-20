import { Alert, AlertTitle, Typography, Box, Button, IconButton, CircularProgress, Container, FormControl, Grid, InputLabel, LinearProgress, MenuItem, InputAdornment, Select, TextField } from "@mui/material";
import { useWss, restAPI } from "blustai-react-core";
import { useEffect, useState } from "react";
import { CloseIcon,CopyToClipboardButton} from "blustai-react-ui";

const service_id = import.meta.env.VITE_TOOL_ID //SET YOUR TOOL ID HERE 

const CorrectionReview = (props) => {
    const { summary, text, errors } = props;
    return <Alert severity={errors.length ? "error" : "success"}>
        <AlertTitle>{summary}</AlertTitle>
        {errors?.map((error,key) => (
            <Box sx={{pt:2}} key={key} >
                <span className={'correction_box correcttion_'+error.type} title={error.type}> </span>
                <Typography variant="dashed">{error.context}</Typography>{'  -  '}
                <Typography variant="caption">{error.description}</Typography>
            </Box>
        ))}
    </Alert>
}


const CustomTool = () => {
    const { client } = useWss();
    const [mode, setMode] = useState(localStorage.getItem("corrector_mode"));
    const [modes, setModes] = useState([]);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState();
    const [submitting, setSubmitting] = useState();
    const [originalText,setOriginalText]=useState('');
    const [response, setResponse] = useState();
    const [dirty,setDirty]=useState(false);



    useEffect(() => {
        setInitializing(true)
        restAPI.list("public-text-modes", { sort: '{"sort":1}' }).then(_modes => {
            setModes(_modes);
            if (!mode && _modes?.length) setMode(_modes[0].name)
            //_data[0]?.name
            return client.init({
                onReady: () => {
                    console.log("Blust AI Client ready");
                },
                onError: (error) => setError(error?.error || error?.message || "Blust AI Client init error")
            });
        }).then(() => {
            setInitializing(false);
        }).catch(err => {
            toast.error(err.error || err.message || "Error loading data");
            setInitializing(false);
            setError(err?.message || err?.error || "There is an error occuried. Please try again later")
        });
    }, [])


    const handleModeChange=(e)=>{
        setMode(e.target.value);
        setDirty(true);
        localStorage.setItem("corrector_mode", e.target.value);
    }
    
    const onSubmit = async () => {
        console.log("using service",service_id)
        if (!originalText) { toast.error("Please, input text"); return };
        setSubmitting(true);
        try {
            setError(null);
            setResponse(null);
            setDirty(false);
            let _response = await client.sendMessage({
                service: service_id,
                featured: true,
                message: originalText,
                params: {mode}
            });
            setResponse(_response);
        } catch (error) {
            toast.error(error?.error || error?.message || "Sending message error")
        }
        setSubmitting(false);
    }

    return <>
        {initializing ?
            <LinearProgress color="info" />
            :
            <Container maxWidth="md" sx={{ pt: 5 }}>
                {error ?
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    :
                    <Grid container spacing={2} >
                        <Grid item xs={12} sx={{ textAlign: 'right', mt: 0.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                                <FormControl size="small" variant="standard">
                                    <InputLabel id="mode-label">Mode</InputLabel>
                                    <Select
                                        value={mode}
                                        onChange={handleModeChange}
                                        labelId="mode-label"
                                        label="Mode"
                                        disabled={submitting}
                                    >
                                        {modes?.map((mode, key) => (
                                            <MenuItem
                                                key={key}
                                                value={mode.name}
                                            >
                                                {mode.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            <TextField
                                id="original"
                                variant="filled"
                                fullWidth
                                multiline
                                maxRows={40}
                                minRows={6}
                                inputProps={{ maxLength: 5000 }}
                                InputProps={{
                                    disableUnderline: true,
                                    style: { borderSize: '1px', borderColor: '#ccc', padding: '1em', paddingRight: '2.5em' },
                                    ...originalText?.length ? {
                                        endAdornment: <InputAdornment position="end" sx={{ position: 'absolute', right: '0.2em', top: '1.5em' }}>
                                            <IconButton onClick={() => {setOriginalText('');setResponse()}}><CloseIcon /></IconButton>
                                        </InputAdornment>,
                                        startAdornment: <InputAdornment position="start" sx={{ position: 'absolute', right: '0.2em', bottom: '1.5em' }}>
                                            <Typography variant="caption" >{originalText.length} / 5000</Typography>
                                        </InputAdornment>
                                    } : {}
                                }}
                                sx={{ borderColor: '#ccc', borderSize: '1px', position: 'relative' }}
                                value={originalText}
                                onChange={(e)=>{setOriginalText(e.target.value);setDirty(true)}}
                                disabled={submitting}
                                placeholder={'Type the text...'}
                                autoFocus
                            />
                            {originalText?.trim()?.length > 0 &&
                                <Button variant="contained" onClick={onSubmit} sx={{ mt: 2 }} disabled={originalText.trim() === "" || submitting|| !dirty}>
                                    Correct mistakes
                                    {submitting &&
                                        <CircularProgress size={20} sx={{ ml: 1 }} />
                                    }
                                </Button>
                            }
                        </Grid>
                        {response?.body &&
                            <Grid item xs={12} >
                                {response.summary &&
                                    <CorrectionReview
                                        summary={response.summary}
                                        text={originalText}
                                        errors={response.errors}
                                    />
                                }
                                <TextField
                                    id="translation"
                                    variant="filled"
                                    fullWidth
                                    multiline
                                    maxRows={40}
                                    minRows={6}
                                    value={response.body}
                                    {...submitting ? {
                                        className: "loading-bg"
                                    } : {}}
                                    InputProps={{
                                        readOnly: true,
                                        disableUnderline: true,
                                        style: { borderSize: '1px', borderColor: '#ccc', padding: '1em', paddingRight: '2.5em' },
                                        endAdornment: <InputAdornment position="end" sx={{ position: 'absolute', right: '0.2em', top: '1.5em' }}>
                                            <CopyToClipboardButton text={response.body} size="small"  />
                                        </InputAdornment>
                                    }}
                                />
                            </Grid>
                        }
                    </Grid>
                }
            </Container>
        }
    </>

}

export default CustomTool;