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

    const handleDownload = () => {
        // Use the proxied URL to bypass 'Access Denied' security blocks.
        // Note: For .m3u8 it will download the manifest. For direct files it will download the video.
        const link = document.createElement('a');
        link.href = currentUrl || streamUrl || url;
        link.setAttribute('download', 'video.mp4'); 
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={`relative bg-black group/player ${className}`}>
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                poster={poster}
                controls
                playsInline
            />
            
            {/* Top Controls Overlay */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/player:opacity-100 transition-opacity z-30">
                {audioTracks.length > 1 && (
                    <div className="relative">
                        <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className="bg-black/60 hover:bg-black/90 p-2 rounded-lg text-white border border-white/10 backdrop-blur-md flex items-center gap-2 text-xs font-bold"
                        >
                            <span className="uppercase">{audioTracks[currentAudio]?.name || 'Audio'}</span>
                        </button>
                        
                        {showSettings && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
                                <div className="p-2 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Select Language</div>
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
                
                {(streamUrl || url) && (
                    <button 
                        onClick={handleDownload}
                        className="bg-white/10 hover:bg-blue-600 p-2 rounded-lg text-white border border-white/10 backdrop-blur-md transition-colors"
                        title="Download Content"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
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
