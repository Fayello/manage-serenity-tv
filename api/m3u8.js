export default async function handler(req, res) {
    const { id, device, stream, path } = req.query;

    if (!id || !device) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    try {
        // 1. Verify License Status via Backend
        const authResponse = await fetch('https://backend.goutsecret.com/api/license/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_hash: device })
        });
        const authStatus = await authResponse.json();

        if (authStatus.status !== 'ACTIVE' && authStatus.status !== 'TRIAL' && authStatus.status !== 'PAID') {
            return res.status(403).json({ error: "Inactive license" });
        }

        // 2. Resolve Channel URL
        let streamUrl = stream ? decodeURIComponent(stream) : "";
        if (!streamUrl) {
            console.log(`Resolving channel ${id} for device ${device}`);
            try {
                const channelRes = await fetch(`https://backend.goutsecret.com/api/channels/${id}/`);
                if (channelRes.ok) {
                    const data = await channelRes.json();
                    streamUrl = data.stream_url;
                } else {
                    console.warn(`Backend channel lookup failed: ${channelRes.status}`);
                    const listRes = await fetch('https://backend.goutsecret.com/api/channels/?page_size=2000');
                    if (listRes.ok) {
                        const data = await listRes.json();
                        const channel = data.results.find(c => String(c.id) === String(id));
                        if (channel) streamUrl = channel.stream_url;
                    }
                }
            } catch (e) {
                console.error("Backend discovery error:", e.message);
            }
        }

        if (!streamUrl) {
            console.error(`Final check failed: No stream URL for ID ${id}`);
            return res.status(404).json({ error: "Stream resolution failed. Ensure ID is valid and accessible." });
        }

        // 3. Construct the actual target URL
        let targetUrl = "";
        let currentBaseUrlObj = null;
        try {
            const baseUrlObj = new URL(streamUrl);
            const currentBaseBase = baseUrlObj.origin + baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf('/') + 1);
            
            let pathPart = path ? decodeURIComponent(path) : null;
            if (pathPart) {
                // If path starts with /, it's relative to the origin, not the parent folder
                const resolvedUrl = pathPart.startsWith('/') ? new URL(pathPart, baseUrlObj.origin) : new URL(pathPart, currentBaseBase);
                targetUrl = resolvedUrl.href;
                if (!resolvedUrl.search && baseUrlObj.search) {
                    targetUrl += baseUrlObj.search;
                }
            } else {
                targetUrl = streamUrl;
            }
            currentBaseUrlObj = new URL(targetUrl);
        } catch (e) {
            return res.status(400).json({ error: "Invalid stream or path URL format", details: e.message, streamUrl, path });
        }

        // 4. Fetch the target (Manifest or Segment)
        // SMART HEADERS: We try to be as minimal as possible first to avoid CDN detection
        const getHeaders = (isRetry = false) => {
            const base = {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
            };
            if (!isRetry) {
                base['Referer'] = currentBaseUrlObj.origin + '/';
                base['Origin'] = currentBaseUrlObj.origin;
            }
            if (req.headers.range) base['Range'] = req.headers.range;
            return base;
        };

        let response;
        try {
            response = await fetch(targetUrl, { headers: getHeaders(), signal: AbortSignal.timeout(8000) });
            // If it failed with 5xx, some CDNs (like Rakuten) might not like our Referer/Origin spoofing. Try again minimally.
            if (!response.ok && response.status >= 500) {
                response = await fetch(targetUrl, { headers: getHeaders(true), signal: AbortSignal.timeout(8000) });
            }
        } catch (fetchError) {
            return res.status(504).json({ error: "Upstream timeout or connection error", details: fetchError.message, target: targetUrl });
        }

        if (!response.ok) {
            console.error(`Upstream failure: ${response.status} for ${targetUrl}`);
            return res.status(response.status).json({ 
                error: "Proxy upstream error", 
                status: response.status,
                target: targetUrl,
                msg: "The provider returned an error. This may be an IP block or temporary outage."
            });
        }

        const finalUrl = response.url;
        const finalUrlObj = new URL(finalUrl);
        const contentType = response.headers.get('content-type');

        // 5. Handle Manifest (.m3u8)
        if (finalUrl.includes('.m3u8') || (contentType && contentType.includes('mpegurl'))) {
            let manifest = await response.text();
            
            const getProxyUrl = (originalLine) => {
                const trimmed = originalLine.trim();
                let relativePath = trimmed;
                if (finalUrlObj.search && trimmed.includes(finalUrlObj.search)) {
                    relativePath = trimmed.replace(finalUrlObj.search, '');
                }
                const streamParam = `&stream=${encodeURIComponent(finalUrl)}`;
                return `/api/m3u8?id=${id}&device=${device}${streamParam}&path=${encodeURIComponent(relativePath)}`;
            };

            const lines = manifest.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;
                if (!trimmed.startsWith('#')) return getProxyUrl(trimmed);
                if (trimmed.includes('URI=')) {
                    return line.replace(/URI="([^"]+)"/g, (match, uri) => `URI="${getProxyUrl(uri)}"`);
                }
                return line;
            });

            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).send(rewrittenLines.join('\n'));
        }

        // 6. Handle Segments (.ts, etc)
        const data = await response.arrayBuffer();
        res.setHeader('Content-Type', contentType || 'video/MP2T');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(Buffer.from(data));

    } catch (error) {
        console.error("Proxy error:", error.message);
        return res.status(500).json({ error: "Proxy service failure", details: error.message });
    }
}
