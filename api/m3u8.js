export default async function handler(req, res) {
    const { id, device, stream } = req.query; // Adding 'stream' as fallback or direct proxy

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
            try {
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
            } catch (e) {
                console.error("Discovery error:", e);
            }
        }

        if (!streamUrl) return res.status(404).json({ error: "Stream URL not found" });

        // 3. Fetch the actual Manifest (.m3u8)
        const manifestRes = await fetch(streamUrl);
        if (!manifestRes.ok) return res.status(500).json({ error: "Failed to fetch source manifest" });
        
        let manifest = await manifestRes.text();

        // 4. Obfuscate / Rewrite Manifest
        const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
        
        const lines = manifest.split('\n');
        const rewrittenLines = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                // If it's a relative URL, we MUST make it absolute so it points to the source
                // OR we'd have to proxy EVERY segment. 
                // To HIDE the source domain, we'd need a segment proxy.
                // For now, we make it absolute if it isn't, so it plays.
                if (!trimmed.startsWith('http')) {
                    return baseUrl + trimmed;
                }
            }
            return line;
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-store'); // Important for live streams
        return res.status(200).send(rewrittenLines.join('\n'));

    } catch (error) {
        console.error("Proxy error:", error.message);
        return res.status(500).json({ error: "Proxy service failure", details: error.message });
    }
}
