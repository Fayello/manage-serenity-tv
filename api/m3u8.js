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
        // If 'path' is provided, we are proxying a segment or a child playlist
        const currentBaseUrlObj = new URL(streamUrl);
        const currentBaseUrl = currentBaseUrlObj.origin + currentBaseUrlObj.pathname.substring(0, currentBaseUrlObj.pathname.lastIndexOf('/') + 1);
        
        let pathPart = path ? decodeURIComponent(path) : null;
        let targetUrl = streamUrl;
        
        if (pathPart) {
            // Reconstruct the target URL. If pathPart already has a token, we don't append another one.
            const resolvedUrl = new URL(pathPart, currentBaseUrl);
            targetUrl = resolvedUrl.href;
            if (!resolvedUrl.search && currentBaseUrlObj.search) {
                targetUrl += currentBaseUrlObj.search;
            }
        }

        // 4. Fetch the target (Manifest or Segment)
        // We forward MOST headers from the client to look exactly like the browser
        const headers = { ...req.headers };
        delete headers.host;
        delete headers.connection;
        // Spoof Referer to match the target's origin if not present
        if (!headers.referer) headers.referer = currentBaseUrlObj.origin + '/';
        headers.origin = currentBaseUrlObj.origin;

        const response = await fetch(targetUrl, { headers });
        if (!response.ok) {
            console.error(`Upstream failure: ${response.status} for ${targetUrl}`);
            return res.status(response.status).json({ 
                error: "Failed to fetch source", 
                status: response.status,
                target: targetUrl,
                headers_sent: headers
            });
        }

        const finalUrl = response.url; // This tracks redirects!
        const finalUrlObj = new URL(finalUrl);
        const contentType = response.headers.get('content-type');

        // 5. Handle Manifest (.m3u8)
        if (finalUrl.includes('.m3u8') || (contentType && contentType.includes('mpegurl'))) {
            let manifest = await response.text();
            const lines = manifest.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    // We pass the RAW line (encoded) as the path. 
                    // To avoid 414, we might strip the token IF it's exactly the same as finalUrl's token.
                    let relativePath = trimmed;
                    if (finalUrlObj.search && trimmed.includes(finalUrlObj.search)) {
                        relativePath = trimmed.replace(finalUrlObj.search, '');
                    }
                    
                    // We propagate the FINAL query string (token) back to the proxy via the 'stream' param
                    const streamParam = `&stream=${encodeURIComponent(finalUrl)}`;
                    return `/api/m3u8?id=${id}&device=${device}${streamParam}&path=${encodeURIComponent(relativePath)}`;
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
