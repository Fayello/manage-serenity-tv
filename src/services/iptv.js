export const fetchChannels = async (url) => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        return parseM3U(text);
    } catch (error) {
        console.error("Error fetching playlist:", error);
        return [];
    }
};

const parseM3U = (data) => {
    const lines = data.split('\n');
    const channels = [];
    let currentChannel = {};

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            // content example: #EXTINF:-1 tvg-id="CNN.us" tvg-name="CNN" tvg-logo="http://..." group-title="News",CNN
            const info = line.substring(8);
            const titleParts = info.split(',');
            const name = titleParts[titleParts.length - 1].trim();

            // Extract attributes
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            const groupMatch = line.match(/group-title="([^"]*)"/);
            const idMatch = line.match(/tvg-id="([^"]*)"/);
            const countryMatch = line.match(/tvg-country="([^"]*)"/);

            currentChannel = {
                name: name,
                logo: logoMatch ? logoMatch[1] : null,
                group: groupMatch ? groupMatch[1] : 'Uncategorized',
                id: idMatch ? idMatch[1] : `channel-${channels.length}`,
                country: countryMatch ? countryMatch[1] : 'Unknown',
            };
        } else if (line.startsWith('http')) {
            if (currentChannel.name) {
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = {};
            }
        }
    });

    return channels;
};

export const groupChannels = (channels) => {
    // Return object with 'countries' and 'categories'
    // But for the UI, let's just return the channels with country data 
    // and letting the UI filter/group is often more flexible.
    // However, keeping existing behavior for categories:
    const categories = channels.reduce((acc, channel) => {
        const group = channel.group || 'Others';
        if (!acc[group]) acc[group] = [];
        acc[group].push(channel);
        return acc;
    }, {});

    return categories;
};

export const getCountries = (channels) => {
    const countries = new Set(channels.map(c => c.country).filter(c => c && c !== 'Unknown'));
    return Array.from(countries).sort();
};
