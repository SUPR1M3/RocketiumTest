import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { designsApi } from '../../services/designsApi';
import type { Design } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import './DesignList.css';

export const DesignList: React.FC = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await designsApi.list({ sortBy: 'updatedAt', order: 'desc' });
      setDesigns(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load designs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDesign = async () => {
    try {
      setIsCreating(true);
      setError(null);
      const newDesign = await designsApi.create({
        name: `Design ${designs.length + 1}`,
        width: 1080,
        height: 1080,
        layers: [],
      });
      navigate(`/designs/${newDesign._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create design');
      setIsCreating(false);
    }
  };

  const handleDeleteDesign = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this design?')) {
      return;
    }

    try {
      await designsApi.delete(id);
      setDesigns(designs.filter((d) => d._id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete design');
    }
  };

  if (isLoading) {
    return (
      <div className="design-list-container">
        <div className="design-list-loading">Loading designs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="design-list-container">
        <div className="design-list-error">
          <p>Error: {error}</p>
          <button onClick={loadDesigns}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="design-list-container">
      <header className="design-list-header">
        <div>
          <h1>My Designs</h1>
          <p className="design-list-subtitle">Create and manage your designs</p>
        </div>
        <button 
          className="btn-create" 
          onClick={handleCreateDesign}
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : '+ New Design'}
        </button>
      </header>

      {designs.length === 0 ? (
        <div className="design-list-empty">
          <div className="empty-icon">📐</div>
          <h2>No designs yet</h2>
          <p>Create your first design to get started</p>
          <button 
            className="btn-create" 
            onClick={handleCreateDesign}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : '+ Create Design'}
          </button>
        </div>
      ) : (
        <div className="design-grid">
          {designs.map((design) => (
            <div
              key={design._id}
              className="design-card"
              onClick={() => navigate(`/designs/${design._id}`)}
            >
              <div className="design-thumbnail">
                {design.thumbnail ? (
                  <img src={design.thumbnail} alt={design.name} />
                ) : (
                  <div className="design-thumbnail-placeholder">
                    <span>{design.width}×{design.height}</span>
                  </div>
                )}
              </div>
              <div className="design-info">
                <h3 className="design-name">{design.name}</h3>
                <div className="design-meta">
                  <span className="design-layers">{design.layers.length} layers</span>
                  <span className="design-updated">
                    {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <button
                className="design-delete"
                onClick={(e) => handleDeleteDesign(design._id, e)}
                title="Delete design"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

