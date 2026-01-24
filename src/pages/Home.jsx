import React, { useState, useEffect, useMemo } from 'react';
import { fetchChannels, groupChannels, getCountries } from '../services/iptv';
import VideoPlayer from '../components/VideoPlayer';
import { Play, LogOut, Menu, Search, X } from 'lucide-react';

const M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';

const Home = () => {
    const [channels, setChannels] = useState([]);
    const [groups, setGroups] = useState({});
    const [countries, setCountries] = useState([]);
    const [activeGroup, setActiveGroup] = useState('All');
    const [activeCountry, setActiveCountry] = useState('All');
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const loadChannels = async () => {
            setLoading(true);
            const data = await fetchChannels(M3U_URL);
            // Limit for performance demo if huge
            // const limitedData = data.slice(0, 5000); 
            const grouped = groupChannels(data);
            const countryList = getCountries(data);
            setChannels(data);
            setGroups(grouped);
            setCountries(countryList);

            // Set default group to first one or 'General'
            const groupNames = Object.keys(grouped);
            if (groupNames.length > 0) setActiveGroup(groupNames[0]);

            setLoading(false);
        };
        loadChannels();
    }, []);

    const filteredChannels = useMemo(() => {
        let list = activeGroup === 'All' ? channels : groups[activeGroup] || [];

        if (activeCountry !== 'All') {
            list = list.filter(c => c.country === activeCountry);
        }

        if (searchQuery) {
            list = list.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return list.slice(0, 100); // Pagination/Limit for rendering performance
    }, [activeGroup, channels, groups, searchQuery, activeCountry]);

    const handleChannelClick = (channel) => {
        setSelectedChannel(channel);
    };

    const handleLogout = () => {
        localStorage.removeItem('serenity_activated');
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-10`}>
                <div className="p-4 flex items-center justify-between">
                    {sidebarOpen && <h1 className="font-bold text-xl text-blue-500 tracking-wider">SERENITY</h1>}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
                        <Menu size={20} />
                    </button>
                </div>

                <div className="px-3 mb-4">
                    <div className={`flex items-center bg-slate-800 rounded-lg overflow-hidden ${!sidebarOpen && 'justify-center'}`}>
                        <Search size={18} className="ml-3 text-slate-500 min-w-[18px]" />
                        {sidebarOpen && (
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none focus:outline-none text-sm p-3 w-full text-slate-300 placeholder:text-slate-600"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        )}
                    </div>
                </div>

                {/* Country Filter */}
                <div className={`px-3 mb-2 ${!sidebarOpen && 'hidden'}`}>
                    <select
                        value={activeCountry}
                        onChange={(e) => setActiveCountry(e.target.value)}
                        className="w-full bg-slate-800 text-slate-300 text-sm rounded-lg p-2 border-none focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                        <option value="All">All Countries</option>
                        {countries.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
                    {Object.keys(groups).sort().map(group => (
                        <button
                            key={group}
                            onClick={() => setActiveGroup(group)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all truncate flex items-center
                                ${activeGroup === group
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <span className={`${!sidebarOpen && 'hidden'}`}>{group}</span>
                            {!sidebarOpen && group.charAt(0)}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 w-full p-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <LogOut size={20} />
                        {sidebarOpen && <span>Deactivate</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative h-full">
                {/* Header / Current Channel Info */}
                {selectedChannel && (
                    <div className="h-64 md:h-96 w-full bg-black relative flex-shrink-0">
                        <div className="absolute top-4 right-4 z-20">
                            <button onClick={() => setSelectedChannel(null)} className="bg-black/50 hover:bg-black/80 p-2 rounded-full text-white backdrop-blur-sm transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <VideoPlayer
                            url={selectedChannel.url}
                            className="w-full h-full"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 pointer-events-none">
                            <h2 className="text-2xl font-bold text-white drop-shadow-md">{selectedChannel.name}</h2>
                            <p className="text-slate-300 text-sm opacity-80">{selectedChannel.group}</p>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {!selectedChannel && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">{activeGroup}</h2>
                            <p className="text-slate-500 text-sm">{filteredChannels.length} Channels Available</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
                        {filteredChannels.map((channel, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleChannelClick(channel)}
                                className={`group relative aspect-video bg-slate-800 rounded-xl overflow-hidden cursor-pointer border border-slate-700 hover:border-blue-500 hover:shadow-blue-500/20 hover:shadow-lg transition-all transform hover:-translate-y-1 ${selectedChannel?.name === channel.name ? 'ring-2 ring-green-500' : ''}`}
                            >
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                    {channel.logo ? (
                                        <img src={channel.logo} alt={channel.name} className="max-w-[80%] max-h-[80%] object-contain opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                                    ) : (
                                        <span className="text-2xl font-bold text-slate-700 group-hover:text-slate-500 select-none">
                                            {channel.name.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute bottom-0 left-0 w-full p-3 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                                    <p className="text-white text-sm font-semibold truncate drop-shadow-sm">{channel.name}</p>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-blue-500/80 p-3 rounded-full text-white shadow-lg backdrop-blur-sm">
                                        <Play size={20} fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredChannels.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                            <Menu size={48} className="mb-4 opacity-20" />
                            <p>No channels found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
