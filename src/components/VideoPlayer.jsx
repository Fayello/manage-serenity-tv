import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { AlertTriangle } from 'lucide-react';

const VideoPlayer = ({ url, poster, className, autoPlay = true }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    const [currentUrl, setCurrentUrl] = React.useState(url);
    const [isProxy, setIsProxy] = React.useState(false);

    useEffect(() => {
        setCurrentUrl(url);
        setIsProxy(false);
    }, [url]);

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
                    console.log("HLS Fatal Error:", data);
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        // Check if we can fallback to proxy
                        if (!isProxy) {
                            console.log("Network Error details:", data.details);
                            // Common CORS/Mixed content errors or 403s on direct stream
                            console.warn("Direct stream failed. Attempting Proxy Fallback...");

                            // Construct Proxy URL
                            // We need to know the backend URL.
                            // Assuming standard relative path /api exists if served together or env var.
                            // But we are in React. Let's try relative /api/stream/proxy first
                            // Note: 'Home.jsx' handles secure channel replacement, but that might fail if server is HTTP only.
                            // Proxy handles strict HTTP.

                            // We go back to original URL (prop) to avoid double proxying if currentUrl was modified
                            const originalStreamUrl = url.replace('https://', 'http://'); // Revert forced https from Home.jsx if needed, or just use raw
                            // Actually better to use the raw `url` prop but ensure we treat it as the target.

                            const proxyUrl = `${window.location.origin}/api/stream/proxy?url=${encodeURIComponent(url)}`;
                            // Or if using specific API_URL env:
                            // const API_URL = import.meta.env.VITE_API_URL || '';
                            // const proxyUrl = `${API_URL}/stream/proxy?url=${encodeURIComponent(url)}`;

                            // Since we don't have easy access to env here nicely without import, 
                            // and we assume proxy is on same origin as other API calls.
                            // Let's use a hardcoded fallback or relative path.
                            // Using the one from `api.js` would be ideal but that's an axios instance.

                            // Let's rely on the fact that if we are failing networking, the proxy might save us.
                            // Use a known good relative path if deployed together, or full path.
                            // For dev: "http://localhost:8000/api/stream/proxy"
                            // For prod: "/api/stream/proxy"

                            let backendUrl = '/api';
                            // Quick hack to detect dev mode default port
                            if (window.location.port === '5173') {
                                backendUrl = 'http://localhost:8000/api';
                            }

                            const fallbackUrl = `${backendUrl}/stream/proxy?url=${encodeURIComponent(url)}`;

                            setIsProxy(true);
                            setCurrentUrl(fallbackUrl);
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
            if (autoPlay) video.play().catch(e => console.log("Autoplay blocked:", e));

            // Native Error Listener for fallback
            const onError = (e) => {
                if (!isProxy) {
                    console.warn("Native Player Error. Attempting Proxy...");
                    let backendUrl = '/api';
                    if (window.location.port === '5173') backendUrl = 'http://localhost:8000/api';
                    const fallbackUrl = `${backendUrl}/stream/proxy?url=${encodeURIComponent(url)}`;
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
            {!url && (
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
