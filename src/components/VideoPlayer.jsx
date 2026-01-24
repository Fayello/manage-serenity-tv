import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { AlertTriangle } from 'lucide-react';

const VideoPlayer = ({ url, poster, className, autoPlay = true }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Cleanup previous hls instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });
            hlsRef.current = hls;
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoPlay) video.play().catch(e => console.log("Autoplay blocked:", e));
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.log("HLS Fatal Error:", data);
                    // Try to recover
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari/iOS)
            video.src = url;
            if (autoPlay) video.play().catch(e => console.log("Autoplay blocked:", e));
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [url, autoPlay]);

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
