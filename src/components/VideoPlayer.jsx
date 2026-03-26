import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { AlertTriangle } from 'lucide-react';
import { API_URL } from '../services/api';

const VideoPlayer = ({ url, channelId, deviceId, streamUrl, poster, className, autoPlay = true }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    const [currentUrl, setCurrentUrl] = React.useState(null);
    const [isProxy, setIsProxy] = React.useState(false);

    useEffect(() => {
        if (channelId && deviceId) {
            // Use Secure Vercel Proxy with the stream URL as a fallback 
            // This bypasses the need for the proxy to authenticate with your backend
            const encodedStream = streamUrl ? encodeURIComponent(streamUrl) : "";
            const secureUrl = `/api/m3u8?id=${channelId}&device=${deviceId}&stream=${encodedStream}`;
            setCurrentUrl(secureUrl);
            setIsProxy(true);
        } else if (url) {
            // Fallback to original logic (e.g. for preview or if new props missing)
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

        // Cleanup previous hls instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
            });
            hlsRef.current = hls;

            // Hook for error handling - detect CORS/Network issues
            const loadStream = (src) => {
                hls.loadSource(src);
                hls.attachMedia(video);
            };

            loadStream(currentUrl);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoPlay) video.play().catch(e => console.log("Autoplay blocked:", e));
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        // Check if we can fallback to proxy
                        if (!isProxy) {
                            const proxyUrl = `${API_URL}/stream/proxy?url=${encodeURIComponent(url)}`;
                            setIsProxy(true);
                            setCurrentUrl(proxyUrl);
                            return;
                        }
                        hls.startLoad();
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        hls.destroy();
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support
            video.src = currentUrl;
            if (autoPlay) video.play().catch(() => {}); // Silence autoplay block logs
            
            const onError = () => {
                if (!isProxy) {
                    const fallbackUrl = `${API_URL}/stream/proxy?url=${encodeURIComponent(url)}`;
                    setIsProxy(true);
                    setCurrentUrl(fallbackUrl);
                }
            };
            video.addEventListener('error', onError, { once: true });
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [currentUrl, autoPlay]);

    return (
        <div className={`relative bg-black ${className}`}>
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                poster={poster}
                controls
                playsInline
            />
            {(!url && !channelId) && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
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
