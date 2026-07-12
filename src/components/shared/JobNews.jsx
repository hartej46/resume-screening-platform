import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Clock, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../../apiConfig';
import './JobNews.css';

const JobNews = ({ candidateId = null, title = "Tech Job Market News" }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const url = candidateId 
                ? `${API_BASE_URL}/api/news?candidateId=${candidateId}`
                : `${API_BASE_URL}/api/news`;
            const response = await axios.get(url);
            setNews(response.data);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await axios.get(`${API_BASE_URL}/api/news/refresh`);
            await fetchNews();
        } catch (error) {
            console.error('Error refreshing news:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, [candidateId]);

    return (
        <div className="glass-card news-container">
            <div className="news-header">
                <div className="news-title-group">
                    <Newspaper size={20} className="text-primary" />
                    <h3 className="news-main-title">{title}</h3>
                </div>
                <button 
                    onClick={handleRefresh} 
                    disabled={refreshing}
                    className="news-refresh-btn"
                    title="Refresh News"
                >
                    <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                </button>
            </div>

            <div className="news-list">
                {loading ? (
                    <div className="news-loading">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="news-skeleton-item">
                                <div className="skeleton-line title"></div>
                                <div className="skeleton-line body"></div>
                            </div>
                        ))}
                    </div>
                ) : news.length > 0 ? (
                    news.map((item, index) => (
                        <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="news-item"
                        >
                            <div className="news-item-content">
                                <h4 className="news-item-title">{item.title}</h4>
                                <p className="news-item-summary">{item.summary}</p>
                                <div className="news-item-footer">
                                    <span className="news-source">
                                        <Tag size={12} /> {item.source}
                                    </span>
                                    <span className="news-time">
                                        <Clock size={12} /> {new Date(item.fetchedAt).toLocaleDateString()}
                                    </span>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-link">
                                        Read More <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="news-empty">
                        <p>No job news found at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobNews;
