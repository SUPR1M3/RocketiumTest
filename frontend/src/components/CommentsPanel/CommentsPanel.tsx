import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getComments, createComment } from '../../services/commentsApi';
import type { Comment, CreateCommentData } from '../../services/commentsApi';
import { useSocketContext } from '../../contexts/SocketContext';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import './CommentsPanel.css';

const CommentsPanel: React.FC = () => {
  const { id: designId } = useParams<{ id: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState(() => {
    // Load author name from localStorage
    return localStorage.getItem('commentAuthorName') || '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const socketContext = useSocketContext();

  // Fetch comments on mount and when designId changes
  useEffect(() => {
    if (designId) {
      fetchComments();
    }
  }, [designId]);

  // Listen for real-time comment updates
  useEffect(() => {
    if (!socketContext?.socket || !socketContext.isConnected || !designId) return;

    const handleNewComment = (data: { designId: string; comment: Comment }) => {
      if (data.designId === designId) {
        setComments((prev) => [data.comment, ...prev]);
        scrollToBottom();
      }
    };

    socketContext.socket.on('new-comment', handleNewComment);

    return () => {
      socketContext.socket.off('new-comment', handleNewComment);
    };
  }, [socketContext, designId]);

  const fetchComments = async () => {
    if (!designId) return;
    
    setIsLoading(true);
    try {
      const response = await getComments(designId);
      // Reverse to show newest first
      setComments(response.data.reverse());
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      showErrorToast('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!designId || !newComment.trim() || !authorName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const commentData: CreateCommentData = {
        content: newComment.trim(),
        author: authorName.trim(),
      };
      
      const response = await createComment(designId, commentData);
      
      // Save author name to localStorage
      localStorage.setItem('commentAuthorName', authorName.trim());
      
      // Add comment to list
      setComments((prev) => [response.data, ...prev]);
      
      // Broadcast to other users
      if (socketContext?.socket && socketContext.isConnected && designId) {
        try {
          socketContext.socket.emit('comment-added', {
            designId,
            comment: response.data,
          });
        } catch (emitError) {
          console.warn('Failed to broadcast comment:', emitError);
          // Non-critical error, comment was saved successfully
        }
      }
      
      // Clear form
      setNewComment('');
      showSuccessToast('Comment added successfully!');
      scrollToBottom();
    } catch (error) {
      console.error('Failed to create comment:', error);
      showErrorToast('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const highlightMentions = (text: string): React.ReactNode => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="mention">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="comments-panel">
      <div className="comments-header">
        <h3>Comments</h3>
        <span className="comments-count">{comments.length}</span>
      </div>

      {/* Add Comment Form */}
      <form className="add-comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="author-input"
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={50}
          required
        />
        <textarea
          className="comment-input"
          placeholder="Add a comment... (use @username to mention)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={1000}
          rows={3}
          required
        />
        <button
          type="submit"
          className="submit-comment-btn"
          disabled={isSubmitting || !newComment.trim() || !authorName.trim()}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      <div className="comments-list">
        {isLoading ? (
          <div className="comments-loading">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-time">{formatTimestamp(comment.createdAt)}</span>
                </div>
                <div className="comment-content">
                  {highlightMentions(comment.content)}
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default CommentsPanel;

