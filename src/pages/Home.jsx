import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { channelService, deviceService, vodService } from '../services/api';
import { getDeviceId } from '../utils/device';
import VideoPlayer from '../components/VideoPlayer';
import { Play, LogOut, Menu, Search, X, Clock } from 'lucide-react'; // Added Clock

const SubscriptionTimer = () => {
    const [expiry, setExpiry] = useState(null);
    const [status, setStatus] = useState('Checking...');

    useEffect(() => {
        const check = async () => {
            try {
                const fingerprint = await getDeviceId();
                const res = await deviceService.checkStatus(fingerprint);

                console.log('License status response:', res.data);

                if (res.data.status === 'ACTIVE' || res.data.status === 'TRIAL' || res.data.status === 'PAID') {
                    setExpiry(new Date(res.data.expiry || res.data.trial_expiry));
                    setStatus(res.data.status === 'TRIAL' ? 'Trial Active' : 'Active');
                } else if (res.data.status === 'TRIAL_EXPIRED') {
                    setStatus('Trial Expired');
                } else {
                    setStatus('Inactive');
                }
            } catch (e) {
                console.error("Subscription check failed:", e);
                console.error("Response:", e.response?.data);
                setStatus('Unknown');
            }
        };
        check();
    }, []);

    if (!expiry) return <span>{status}</span>;

    const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <div>
            <div className="flex items-center gap-2 mb-1">
                <Clock size={12} className={daysLeft < 3 ? "text-red-400" : "text-green-400"} />
                <span className={daysLeft < 3 ? "text-red-400 font-bold" : "text-green-400"}>
                    {daysLeft} Days Left
                </span>
            </div>
            <span className="text-[10px] opacity-60 block">{expiry.toLocaleDateString()}</span>
        </div>
    );
};

const Home = () => {
    const [mode, setMode] = useState('live'); // 'live' | 'cinema'
    const [channels, setChannels] = useState([]);
    const [series, setSeries] = useState([]);
    const [activeSeries, setActiveSeries] = useState(null); // New: tracking current series for episodes
    const [groups, setGroups] = useState([]);
    const [countries, setCountries] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [activeGroup, setActiveGroup] = useState('All');
    const [activeCountry, setActiveCountry] = useState('All');
    const [activeLanguage, setActiveLanguage] = useState('All');
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const loaderRef = useRef(null);
    const contentRef = useRef(null);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingSub, setIsFetchingSub] = useState(false);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [deviceId, setDeviceId] = useState(null);

    useEffect(() => {
        getDeviceId().then(setDeviceId);
    }, []);

    // Refresh Metadata (Categories/Countries/Langs)
    const fetchMetadata = async () => {
        try {
            const [catsRes, countriesRes, langsRes] = await Promise.all([
                channelService.getCategories(),
                channelService.getCountries(),
                channelService.getLanguages()
            ]);
            setGroups(['All', ...catsRes.data]);
            setCountries(['All', ...countriesRes.data]);
            setLanguages(['All', ...langsRes.data]);
        } catch (error) {
            console.error("Failed to load metadata", error);
        }
    };

    useEffect(() => {
        fetchMetadata();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Main Fetching Logic
    const fetchData = useCallback(async () => {
        if (activeSeries) return; // Don't fetch root channels/series if we are inside a series
        
        if (page === 1) setLoading(true);
        setIsFetchingSub(true);
        try {
            const params = {
                page,
                category: activeGroup === 'All' ? undefined : activeGroup,
                country: activeCountry === 'All' ? undefined : activeCountry,
                language: activeLanguage === 'All' ? undefined : activeLanguage,
                search: debouncedSearch || undefined
            };

            let response;
            if (mode === 'live') {
                response = await channelService.getChannels(page, params);
                const newItems = response.data.results || [];
                setChannels(prev => page === 1 ? newItems : [...prev, ...newItems]);
            } else {
                response = await vodService.getSeries(page, params);
                const newItems = response.data.results || [];
                setSeries(prev => page === 1 ? newItems : [...prev, ...newItems]);
            }
            
            setHasMore(!!response.data.next);
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
            setIsFetchingSub(false);
        }
    }, [mode, activeGroup, activeCountry, activeLanguage, debouncedSearch, page, activeSeries]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSeriesClick = async (s) => {
        setLoading(true);
        try {
            const res = await vodService.getEpisodes(s.id);
            setChannels(res.data);
            setActiveSeries(s);
            if (contentRef.current) contentRef.current.scrollTo(0, 0);
        } catch (e) {
            console.error("Failed to load episodes", e);
        } finally {
            setLoading(false);
        }
    };

    // Reset filters and metadata on mode change
    useEffect(() => {
        setActiveGroup('All');
        setActiveCountry('All');
        setActiveLanguage('All');
        setActiveSeries(null);
        setPage(1);
        fetchMetadata(); 
        if (contentRef.current) contentRef.current.scrollTo(0, 0);
    }, [mode]);

    // Reset page on search or filter change
    useEffect(() => {
        setPage(1);
        setActiveSeries(null);
        if (contentRef.current) contentRef.current.scrollTo(0, 0);
    }, [activeGroup, activeCountry, activeLanguage, debouncedSearch]);

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
    }, [activeGroup, activeCountry, debouncedSearch]);

    const filteredChannels = channels; // Now fully offloaded to server

    const handleChannelClick = (channel) => {
        setSelectedChannel(channel);
    };

    // Analytics: Record View and Heartbeat when channel changes
    useEffect(() => {
        if (selectedChannel) {
            const record = async () => {
                try {
                    const fingerprint = await getDeviceId();
                    await channelService.recordView(selectedChannel.id, fingerprint);
                } catch (e) {
                    console.error("Failed to record view", e);
                }
            };

            // Initial record
            record();

            // Heartbeat every 60 seconds
            const interval = setInterval(record, 60000);
            return () => clearInterval(interval);
        }
    }, [selectedChannel]);

    const handleLogout = () => {
        // "Deactivate" locally just clears session for user perception which triggers re-check
        // In real world, we might want to also call an API to clearing specific session if we had one
        // But since we track by Device ID, we just reload page which triggers verifyStatus
        window.location.reload();
    };

    // Responsive: Auto-close sidebar on mobile on mount
    useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, []);

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
        <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans relative">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed md:relative inset-y-0 left-0 h-full bg-[#0F111A] border-r border-white/5 flex flex-col transition-all duration-300 z-50 shadow-2xl md:shadow-none
                ${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64 md:translate-x-0 md:w-20'}
            `}>
                <div className="p-4 flex items-center justify-between h-16">
                    <div className={`${!sidebarOpen && 'md:hidden'} flex items-center gap-2`}>
                        <h1 className="font-bold text-xl text-blue-500 tracking-wider">SERENITY</h1>
                    </div>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg hidden md:block text-slate-400">
                        <Menu size={20} />
                    </button>
                    {/* Mobile Close Button */}
                    <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-lg md:hidden ml-auto text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Mode Toggle */}
                <div className="px-3 mb-4 flex gap-2">
                    <button 
                        onClick={() => setMode('live')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${mode === 'live' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                    >
                        LIVE TV
                    </button>
                    <button 
                        onClick={() => setMode('cinema')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${mode === 'cinema' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                    >
                        CINEMA
                    </button>
                </div>

                <div className="px-3 mb-6">
                    <div className="flex items-center bg-white/5 rounded-xl overflow-hidden border border-white/5">
                        <div className="w-12 h-10 flex items-center justify-center shrink-0">
                            <Search size={18} className="text-slate-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            className={`bg-transparent border-none focus:outline-none text-sm h-10 w-full text-slate-300 placeholder:text-slate-600 ${!sidebarOpen && 'md:w-0 md:p-0 md:opacity-0'} transition-all`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                    <p className="px-3 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Categories</p>
                    {groups.map(group => (
                        <button
                            key={group}
                            onClick={() => { setActiveGroup(group); if (window.innerWidth < 768) setSidebarOpen(false); }}
                            className={`w-full text-left p-2.5 rounded-xl text-sm transition-all truncate flex items-center gap-3 group
                                ${activeGroup === group
                                    ? (mode === 'live' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white')
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <div className={`shrink-0 font-bold w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                                ${activeGroup === group ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                <span className="text-[10px] uppercase">{group.charAt(0)}</span>
                            </div>
                            <span className={`${!sidebarOpen && 'md:hidden'} font-medium`}>{group}</span>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                    <div className={`mb-4 bg-white/5 rounded-xl p-3 text-xs text-slate-400 ${!sidebarOpen && 'md:hidden'}`}>
                        <SubscriptionTimer />
                    </div>

                    <button onClick={handleLogout} className={`flex items-center gap-3 text-red-400 hover:text-red-300 w-full p-3 rounded-xl hover:bg-red-500/10 transition-colors ${!sidebarOpen && 'md:justify-center'}`}>
                        <LogOut size={20} />
                        <span className={`${!sidebarOpen && 'md:hidden'} font-bold text-sm`}>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative h-full w-full">
                {/* Mobile Header */}
                <div className="md:hidden p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-300">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg text-blue-500 tracking-wider">SERENITY</span>
                    <div className="w-8"></div>
                </div>

                {/* Player Area */}
                {selectedChannel && (
                    <div className="h-64 md:h-96 w-full bg-black relative flex-shrink-0 border-b border-white/5">
                        <div className="absolute top-4 right-4 z-20">
                            <button onClick={() => setSelectedChannel(null)} className="bg-black/50 hover:bg-black/80 p-2 rounded-full text-white backdrop-blur-sm transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <VideoPlayer
                            channelId={selectedChannel.id}
                            deviceId={deviceId}
                            streamUrl={selectedChannel.stream_url}
                            poster={selectedChannel.logo_url}
                            className="w-full h-full"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-6 pt-20 pointer-events-none">
                            <h2 className="text-2xl font-bold text-white mb-1">{selectedChannel.name}</h2>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded border border-blue-600/30 uppercase font-bold">{selectedChannel.category}</span>
                                <span>{selectedChannel.country}</span>
                                <span>{selectedChannel.language}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Grid & Filters */}
                <div ref={contentRef} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            {activeSeries ? (
                                <button 
                                    onClick={() => setActiveSeries(null)}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-xs font-bold uppercase transition-colors"
                                >
                                    <X size={14} /> Back to Movies
                                </button>
                            ) : null}
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {activeSeries ? activeSeries.title : (mode === 'live' ? 'Live Channels' : 'Cinema / VOD')}
                            </h2>
                            <p className="text-slate-500 text-sm">
                                {activeSeries 
                                    ? `Showing ${channels.length} episodes` 
                                    : `Browsing ${activeGroup} in ${mode === 'live' ? 'Live TV' : 'VOD Mode'}`
                                }
                            </p>
                        </div>
                        
                        {!activeSeries && (
                            <div className="flex flex-wrap gap-3">
                                {/* Secondary Filters */}
                                <select 
                                    value={activeCountry} 
                                    onChange={(e) => setActiveCountry(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="All">All Countries</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>

                                <select 
                                    value={activeLanguage} 
                                    onChange={(e) => setActiveLanguage(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="All">All Languages</option>
                                    {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Mode-Specific Grid */}
                    <div className={`grid gap-4 pb-10 ${ (mode === 'live' || activeSeries) ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'}`}>
                        {(mode === 'live' || activeSeries) ? (
                            channels.map((channel, idx) => (
                                <div
                                    key={`${channel.id}-${idx}`}
                                    onClick={() => handleChannelClick(channel)}
                                    className={`group relative aspect-video bg-slate-900 rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-blue-500 transition-all transform hover:-translate-y-1 ${selectedChannel?.id === channel.id ? 'ring-2 ring-blue-500' : ''}`}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center p-4">
                                        {channel.logo_url ? (
                                            <img src={channel.logo_url} alt={channel.name} className="max-w-full max-h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <span className="text-2xl font-bold text-slate-800">
                                                {channel.episode ? `E${channel.episode}` : channel.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 w-full p-3 uppercase tracking-tighter">
                                        <p className="text-[10px] font-bold text-white truncate">
                                            {channel.episode ? `Episode ${channel.episode}: ${channel.name}` : channel.name}
                                        </p>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-blue-600 p-3 rounded-full shadow-xl">
                                            <Play size={16} fill="currentColor" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            series.map((item, idx) => (
                                <div
                                    key={`${item.id}-${idx}`}
                                    onClick={() => handleSeriesClick(item)}
                                    className="group relative aspect-[2/3] bg-slate-900 rounded-lg overflow-hidden cursor-pointer border border-white/5 hover:border-purple-500 transition-all transform hover:-translate-y-1"
                                >
                                    <div className="absolute inset-0">
                                        {item.logo_url ? (
                                            <img src={item.logo_url} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600 font-bold text-xl">{item.title.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                                    <div className="absolute bottom-0 left-0 w-full p-2">
                                        <p className="text-white text-[10px] font-bold truncate tracking-tight">{item.title}</p>
                                        <p className="text-purple-400 text-[8px] font-bold uppercase tracking-widest">{item.episode_count} Episodes</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Infinite Scroll Loader (Only show if NOT in active series view) */}
                    {!activeSeries && (
                        <div
                            ref={loaderRef}
                            className="h-20 flex items-center justify-center"
                        >
                            {isFetchingSub && (
                                <div className="animate-pulse flex items-center gap-2 text-slate-500">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                                    <span className="text-sm ml-2 font-bold tracking-widest uppercase text-[10px]">Syncing Catalog...</span>
                                </div>
                            )}
                            {!hasMore && (mode === 'live' ? channels.length > 0 : series.length > 0) && (
                                <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest opacity-50">End of Catalog</p>
                            )}
                        </div>
                    )}

                    {(mode === 'live' ? channels.length === 0 : series.length === 0) && !loading && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                            <Menu size={48} className="mb-4 opacity-20" />
                            <p className="text-sm font-medium">No {mode === 'live' ? 'channels' : 'series'} found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
