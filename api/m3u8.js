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
            const channelRes = await fetch(`https://backend.goutsecret.com/api/channels/${id}/`);
            if (channelRes.ok) {
                const data = await channelRes.json();
                streamUrl = data.stream_url;
            } else {
                const listRes = await fetch('https://backend.goutsecret.com/api/channels/?page_size=1000');
                const data = await listRes.json();
                const channel = data.results.find(c => String(c.id) === String(id));
                if (channel) streamUrl = channel.stream_url;
            }
        }

        if (!streamUrl) return res.status(404).json({ error: "Stream URL not found" });

        // 3. Construct the actual target URL
        // If 'path' is provided, we are proxying a segment or a child playlist
        const urlObj = new URL(streamUrl);
        const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
        const targetUrl = path ? (new URL(path, baseUrl).href + urlObj.search) : streamUrl;

        // 4. Fetch the target (Manifest or Segment)
        const response = await fetch(targetUrl);
        if (!response.ok) return res.status(response.status).json({ error: "Failed to fetch source" });

        const contentType = response.headers.get('content-type');

        // 5. Handle Manifest (.m3u8)
        if (targetUrl.includes('.m3u8') || (contentType && contentType.includes('mpegurl'))) {
            let manifest = await response.text();
            const lines = manifest.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    // Rewrite relative or absolute URL to point to OUR proxy
                    // We pass 'path' as the relative part
                    let relativePath = trimmed;
                    if (trimmed.startsWith('http')) {
                        // If it's absolute, we try to make it relative to the stream's base
                        try {
                            const segmentUrl = new URL(trimmed);
                            if (segmentUrl.host === urlObj.host) {
                                relativePath = segmentUrl.pathname.replace(urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1), '');
                            }
                        } catch(e) {}
                    }
                    return `/api/m3u8?id=${id}&device=${device}&path=${encodeURIComponent(relativePath)}`;
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
