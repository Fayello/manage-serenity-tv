import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { AlertTriangle } from 'lucide-react';
import { API_URL } from '../services/api';

const VideoPlayer = ({ url, channelId, deviceId, streamUrl, poster, className, autoPlay = true }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    const [audioTracks, setAudioTracks] = React.useState([]);
    const [currentAudio, setCurrentAudio] = React.useState(-1);
    const [showSettings, setShowSettings] = React.useState(false);
    const [currentUrl, setCurrentUrl] = React.useState('');
    const [isProxy, setIsProxy] = React.useState(false);
    
    // Recording state
    const [isRecording, setIsRecording] = React.useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    useEffect(() => {
        if (channelId && deviceId) {
            const encodedStream = streamUrl ? encodeURIComponent(streamUrl) : "";
            const secureUrl = `/api/m3u8?id=${channelId}&device=${deviceId}&stream=${encodedStream}`;
            setCurrentUrl(secureUrl);
            setIsProxy(true);
        } else if (url) {
            if (window.location.protocol === 'https:' && url.startsWith('http://')) {
                setCurrentUrl(`${API_URL}/stream/proxy?url=${encodeURIComponent(url)}`);
                setIsProxy(true);
            } else {
                setCurrentUrl(url);
                setIsProxy(false);
            }
        }
    }, [url, channelId, deviceId, streamUrl]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !currentUrl) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                maxBufferLength: 30,
            });
            hlsRef.current = hls;

            hls.loadSource(currentUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoPlay) video.play().catch(() => {});
            });

            hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
                setAudioTracks(data.audioTracks || []);
            });

            hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (event, data) => {
                setCurrentAudio(data.id);
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        if (!isProxy && url) {
                            setCurrentUrl(`${API_URL}/stream/proxy?url=${encodeURIComponent(url)}`);
                            setIsProxy(true);
                        } else {
                            hls.startLoad();
                        }
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = currentUrl;
            if (autoPlay) video.play().catch(() => {});
        }

        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [currentUrl, autoPlay, isProxy, url]);

    const changeAudio = (id) => {
        if (hlsRef.current) {
            hlsRef.current.audioTrack = id;
            setCurrentAudio(id);
            setShowSettings(false);
        }
    };

    const handleRecord = () => {
        if (isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        } else {
            const video = videoRef.current;
            // Ensure video isn't muted by accident
            video.muted = false;
            
            // Capture stream and explicitly check for audio
            const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
            
            // Check if we have audio tracks. If not, recording will be silent.
            if (stream.getAudioTracks().length === 0) {
                console.warn("No audio tracks found in captured stream. Recording may be silent.");
            }

            const recorder = new MediaRecorder(stream, { 
                mimeType: 'video/webm;codecs=vp9,opus' 
            });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `serenity_tv_record_${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };

            recorder.start(1000); // Sample every second for stability
            setIsRecording(true);
        }
    };

    return (
        <div className={`relative bg-black group/player ${className}`}>
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                poster={poster}
                controls
                playsInline
                crossOrigin="anonymous"
                onLoadedMetadata={() => {
                    if (videoRef.current) videoRef.current.muted = false;
                }}
            />
            
            {/* Top Controls Overlay - Stay visible if recording */}
            <div className={`absolute top-4 right-4 flex gap-2 transition-opacity z-30 ${isRecording ? 'opacity-100' : 'opacity-0 group-hover/player:opacity-100'}`}>
                {/* Language Switcher */}
                {audioTracks.length > 0 && (
                    <div className="relative">
                        <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-lg border backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-all ${showSettings ? 'bg-blue-600 border-blue-400 text-white' : 'bg-black/60 hover:bg-black/80 border-white/10 text-slate-300'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        </button>
                        
                        {showSettings && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
                                <div className="p-2 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Language Options</div>
                                {audioTracks.map((track) => (
                                    <button
                                        key={track.id}
                                        onClick={() => changeAudio(track.id)}
                                        className={`w-full text-left px-4 py-3 text-xs transition-colors hover:bg-white/5 border-b border-white/5 last:border-0 ${currentAudio === track.id ? 'text-blue-400 font-bold bg-blue-400/5' : 'text-slate-300'}`}
                                    >
                                        {track.name} {track.lang && `(${track.lang.toUpperCase()})`}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Record Button */}
                {(streamUrl || url || channelId) && (
                    <button 
                        onClick={handleRecord}
                        className={`p-2 rounded-lg border backdrop-blur-md transition-all flex items-center gap-2 ${isRecording ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-black/60 hover:bg-black/80 border-white/10'}`}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
                        {isRecording && <span className="text-[10px] text-white font-bold uppercase tracking-tighter">REC</span>}
                    </button>
                )}
            </div>

            {(!url && !channelId) && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-950/20 backdrop-blur-sm">
                    <div className="text-center">
                        <AlertTriangle className="mx-auto mb-2 opacity-50" />
                        <p>No Stream Selected</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
