import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { channelService } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import { Play, LogOut, Menu, Search, X } from 'lucide-react';

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
    const loaderRef = useRef(null);
    const contentRef = useRef(null);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingSub, setIsFetchingSub] = useState(false);

    useEffect(() => {
        const fetchMetadata = async () => {
            setLoading(true);
            try {
                const [colsRes, catsRes] = await Promise.all([
                    channelService.getCountries(),
                    channelService.getCategories()
                ]);
                setCountries(colsRes.data);
                const categoryList = catsRes.data;
                const groupsMap = {};
                categoryList.forEach(c => groupsMap[c] = []);
                setGroups(groupsMap);

                if (categoryList.length > 0) setActiveGroup(categoryList[0]);
            } catch (error) {
                console.error("Failed to load metadata", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetadata();
    }, []);

    // Fetch channels when filters or page changes
    useEffect(() => {
        const fetchChannels = async () => {
            if (page === 1) setLoading(true);
            setIsFetchingSub(true);
            try {
                const params = {};
                if (activeGroup !== 'All') params.category = activeGroup;
                if (activeCountry !== 'All') params.country = activeCountry;
                if (searchQuery) params.search = searchQuery;

                const response = await channelService.getChannels(page, params);
                const newChannels = response.data.results || [];

                if (page === 1) {
                    setChannels(newChannels);
                } else {
                    setChannels(prev => [...prev, ...newChannels]);
                }

                setHasMore(!!response.data.next);
            } catch (error) {
                console.error("Failed to fetch channels", error);
            } finally {
                setLoading(false);
                setIsFetchingSub(false);
            }
        };

        fetchChannels();
    }, [activeGroup, activeCountry, searchQuery, page]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const option = {
            root: null,
            rootMargin: '20px',
            threshold: 0
        };
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasMore && !isFetchingSub && !loading) {
                setPage(prev => prev + 1);
            }
        }, option);

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, isFetchingSub, loading]);

    // Reset page and Scroll to top when filters change
    useEffect(() => {
        setPage(1);
        if (contentRef.current) contentRef.current.scrollTo(0, 0);
    }, [activeGroup, activeCountry, searchQuery]);

    const filteredChannels = channels; // Now fully offloaded to server

    const handleChannelClick = (channel) => {
        setSelectedChannel(channel);
    };

    const handleLogout = () => {
        // "Deactivate" locally just clears session for user perception which triggers re-check
        // In real world, we might want to also call an API to clearing specific session if we had one
        // But since we track by Device ID, we just reload page which triggers verifyStatus
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-slate-500 font-mono text-sm animate-pulse">SYNCING CONTENT DO NOT CLOSE...</p>
                </div>
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
                        {sidebarOpen && <span>Reload / Re-Auth</span>}
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
                            url={selectedChannel.stream_url}
                            className="w-full h-full"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 pointer-events-none">
                            <h2 className="text-2xl font-bold text-white drop-shadow-md">{selectedChannel.name}</h2>
                            <p className="text-slate-300 text-sm opacity-80">{selectedChannel.category}</p>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div ref={contentRef} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">{activeGroup}</h2>
                        <p className="text-slate-500 text-sm">
                            {activeGroup !== 'All' ? `${activeGroup} Channels` : 'All Channels'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-10">
                        {filteredChannels.map((channel, idx) => (
                            <div
                                key={`${channel.id}-${idx}`}
                                onClick={() => handleChannelClick(channel)}
                                className={`group relative aspect-video bg-slate-800 rounded-xl overflow-hidden cursor-pointer border border-slate-700 hover:border-blue-500 hover:shadow-blue-500/20 hover:shadow-lg transition-all transform hover:-translate-y-1 ${selectedChannel?.id === channel.id ? 'ring-2 ring-blue-500' : ''}`}
                            >
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                    {channel.logo_url ? (
                                        <img src={channel.logo_url} alt={channel.name} className="max-w-[80%] max-h-[80%] object-contain opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
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

                    {/* Infinite Scroll Loader */}
                    <div
                        ref={loaderRef}
                        className="h-20 flex items-center justify-center"
                    >
                        {isFetchingSub && (
                            <div className="animate-pulse flex items-center gap-2 text-slate-500">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                                <span className="text-sm ml-2">Loading more...</span>
                            </div>
                        )}
                        {!hasMore && filteredChannels.length > 0 && (
                            <p className="text-slate-600 text-sm italic">Reached the end of the catalog</p>
                        )}
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
