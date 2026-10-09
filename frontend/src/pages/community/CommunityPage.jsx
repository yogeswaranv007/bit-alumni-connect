import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { communityApi } from '../../api/communityApi';
import { campusVisitApi } from '../../api/campusVisitApi';
import {
  MessageSquare,
  Plus,
  Search,
  ChevronUp,
  Eye,
  CheckCircle2,
  Pin,
  Briefcase,
  HelpCircle,
  Users,
  X,
  Send,
  ArrowLeft,
  Edit3,
  Trash2,
  Award,
  Building2,
  Loader2,
  RefreshCw,
  Globe,
  ThumbsUp,
  MessageCircle,
  Clock,
  User as UserIcon,
  ShieldCheck,
  Share2,
  ExternalLink,
  FileText,
  Check,
  CornerDownRight,
  AlertCircle
} from 'lucide-react';

// ─── Filter & Content Type Configurations ────────────────────────────────────

const FILTER_TABS = [
  { value: '', label: 'All', icon: Globe },
  { value: 'QUESTION', label: 'Questions', icon: HelpCircle },
  { value: 'DISCUSSION', label: 'Discussions', icon: Users },
  { value: 'OPPORTUNITY', label: 'Opportunities', icon: Briefcase },
  { value: 'POST', label: 'General Posts', icon: FileText },
];

const POST_TYPES = [
  {
    type: 'QUESTION',
    label: 'Question',
    icon: HelpCircle,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    activeTab: 'bg-blue-600 text-white',
    descPlaceholder: 'Describe your doubt, what you tried, and where you are stuck.',
    titlePlaceholder: 'e.g., How to optimize memory usage in Spring Boot microservices?',
  },
  {
    type: 'DISCUSSION',
    label: 'Discussion',
    icon: Users,
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    activeTab: 'bg-purple-600 text-white',
    descPlaceholder: 'What would you like to discuss with the BIT community?',
    titlePlaceholder: 'e.g., Transitioning from frontend engineering to cloud architecture',
  },
  {
    type: 'OPPORTUNITY',
    label: 'Opportunity',
    icon: Briefcase,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    activeTab: 'bg-emerald-600 text-white',
    descPlaceholder: 'Provide details about the role, responsibilities, and how students/alumni can apply.',
    titlePlaceholder: 'e.g., Software Engineering Intern Summer 2026 at Zoho',
  },
  {
    type: 'POST',
    label: 'General Post',
    icon: FileText,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    activeTab: 'bg-indigo-600 text-white',
    descPlaceholder: 'Share an achievement, project update, resource, or experience.',
    titlePlaceholder: 'e.g., Our team secured 1st place in the National Robotics Hackathon',
  },
];

const SORT_OPTIONS = [
  { value: 'LATEST', label: 'Latest' },
  { value: 'MOST_UPVOTED', label: 'Most Upvoted' },
  { value: 'UNANSWERED', label: 'Unanswered Questions' },
];

const ROLE_BADGE = {
  ROLE_ALUMNI:   { label: 'Alumni',   color: 'bg-amber-100 text-amber-800 border-amber-200' },
  ROLE_STAFF:    { label: 'Faculty',  color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ROLE_ADMIN:    { label: 'Admin',    color: 'bg-red-100 text-red-800 border-red-200' },
  ROLE_STUDENT:  { label: 'Student',  color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

function formatRelative(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AuthorBadge({ roles = [] }) {
  const primary = ['ROLE_ADMIN', 'ROLE_STAFF', 'ROLE_ALUMNI', 'ROLE_STUDENT'].find(r => roles.includes(r));
  const meta = primary ? ROLE_BADGE[primary] : null;
  if (!meta) return null;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-wide uppercase ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const meta = POST_TYPES.find(p => p.type === type) || POST_TYPES[3];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${meta.color}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function OpportunityBadge({ status }) {
  if (status === 'VERIFIED_BY_BIT') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
        <ShieldCheck className="w-3 h-3 text-emerald-700" />
        Verified by BIT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
      Community Submitted
    </span>
  );
}

// ─── Post Card Component ──────────────────────────────────────────────────────

function PostCard({ post, onSelect, onToggleUpvote, onCopyLink, currentUserId, isAdmin, onEdit, onDelete }) {
  const isAuthor = currentUserId && post.authorId === currentUserId;
  const isOwnerOrAdmin = isAuthor || isAdmin;

  return (
    <div
      id={`post-card-${post.id}`}
      className={`group bg-white rounded-xl border transition-all duration-200 hover:shadow-sm overflow-hidden ${
        post.isPinned ? 'border-amber-300 bg-amber-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {post.isPinned && (
        <div className="flex items-center gap-1.5 px-4 py-1 bg-amber-100/70 border-b border-amber-200 text-amber-900 text-[11px] font-semibold">
          <Pin className="w-3 h-3 text-amber-700" />
          <span>Pinned Community Announcement</span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Top metadata row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={post.contentType} />

            {/* Question status */}
            {post.contentType === 'QUESTION' && (
              post.isSolved ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-green-100 text-green-800 border border-green-200">
                  <CheckCircle2 className="w-3 h-3 text-green-600" /> Solved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                  Open Question
                </span>
              )
            )}

            {/* Opportunity verification */}
            {post.contentType === 'OPPORTUNITY' && (
              <OpportunityBadge status={post.opportunityModerationStatus} />
            )}

            {/* Department tag */}
            {post.departmentName && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                <Building2 className="w-3 h-3 text-slate-400" />
                {post.departmentName}
              </span>
            )}
          </div>

          {/* Quick options: edit / delete for author or admin */}
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                title="Edit Post"
                onClick={(e) => { e.stopPropagation(); onEdit(post); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Delete Post"
                onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <h2
          onClick={() => onSelect(post)}
          className="text-base font-semibold text-slate-900 group-hover:text-bit-700 transition-colors cursor-pointer leading-snug mb-1.5 line-clamp-2"
        >
          {post.title}
        </h2>

        {/* Body preview */}
        <p
          onClick={() => onSelect(post)}
          className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2 cursor-pointer mb-3"
        >
          {post.body}
        </p>

        {/* Opportunity quick metadata bar */}
        {post.contentType === 'OPPORTUNITY' && (post.opportunityCompany || post.opportunityRole || post.opportunityLocation) && (
          <div className="flex flex-wrap items-center gap-3 mb-3 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700">
            {post.opportunityCompany && (
              <span className="font-semibold text-emerald-950 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-600" />
                {post.opportunityCompany}
              </span>
            )}
            {post.opportunityRole && (
              <span className="text-slate-600">
                • Role: <span className="font-medium text-slate-900">{post.opportunityRole}</span>
              </span>
            )}
            {post.opportunityLocation && (
              <span className="text-slate-500">
                • {post.opportunityLocation}
              </span>
            )}
            {post.opportunityType && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-100/70 text-emerald-800 font-medium capitalize">
                {post.opportunityType}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && (
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {post.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
              <span
                key={tag}
                className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom author and engagement bar */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
          {/* Author information */}
          <div className="flex items-center gap-2 min-w-0">
            {post.isAnonymous ? (
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            ) : post.authorPhotoUrl ? (
              <img
                src={post.authorPhotoUrl}
                alt={post.authorName || 'Author'}
                className="w-6 h-6 rounded-full object-cover border border-slate-200 flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-bit-700 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {(post.authorName || 'U')[0].toUpperCase()}
              </div>
            )}

            <div className="flex items-center gap-1.5 truncate text-xs">
              <span className="font-medium text-slate-800 truncate">
                {post.isAnonymous ? 'Anonymous' : (post.authorName || 'BIT Member')}
              </span>
              {!post.isAnonymous && <AuthorBadge roles={post.authorRoles ? Object.values(post.authorRoles) : []} />}
              <span className="text-slate-400 text-[11px]">· {formatRelative(post.createdAt)}</span>
            </div>
          </div>

          {/* Action buttons: upvote, reply count, copy link */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 flex-shrink-0">
            {/* Upvote button */}
            <button
              type="button"
              id={`upvote-post-${post.id}`}
              onClick={(e) => { e.stopPropagation(); onToggleUpvote(post.id); }}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold transition-colors ${
                post.hasUpvoted
                  ? 'bg-bit-50 text-bit-700 border-bit-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-bit-700'
              }`}
            >
              <ChevronUp className={`w-3.5 h-3.5 ${post.hasUpvoted ? 'text-bit-700 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>{post.upvoteCount}</span>
            </button>

            {/* Replies link */}
            <button
              type="button"
              onClick={() => onSelect(post)}
              className="inline-flex items-center gap-1 hover:text-bit-700 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>{post.replyCount}</span>
            </button>

            {/* Share / Copy link */}
            <button
              type="button"
              title="Copy link to discussion"
              onClick={(e) => { e.stopPropagation(); onCopyLink(post.id); }}
              className="p-1 hover:text-bit-700 rounded hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Post Detail View Component ───────────────────────────────────────────────

function PostDetailView({
  post,
  onBack,
  onUpvote,
  onCopyLink,
  userRoles,
  currentUserId,
  onPostUpdated,
  onPostDeleted
}) {
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [replyAnon, setReplyAnon] = useState(false);
  const [parentReply, setParentReply] = useState(null); // { id, authorName }
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const replyInputRef = useRef(null);

  const isAdmin = userRoles?.includes('ROLE_ADMIN');
  const isAuthor = currentUserId && post.authorId === currentUserId;
  const isOwnerOrAdmin = isAuthor || isAdmin;

  const loadReplies = useCallback(async () => {
    setRepliesLoading(true);
    try {
      const res = await communityApi.getReplies(post.id, { page: 0, size: 50 });
      const data = res.data.data || res.data;
      setReplies(data.content || []);
    } catch {
      /* ignore */
    } finally {
      setRepliesLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    loadReplies();
  }, [loadReplies]);

  const handleToggleReplyUpvote = async (replyId) => {
    try {
      const res = await communityApi.toggleReplyUpvote(replyId);
      const updated = res.data.data || res.data;
      setReplies(rs => rs.map(r => r.id === replyId ? { ...r, ...updated } : r));
    } catch { /* ignore */ }
  };

  const handleAcceptReply = async (replyId) => {
    try {
      const res = await communityApi.acceptReply(post.id, replyId);
      const updatedPost = res.data.data || res.data;
      onPostUpdated(updatedPost);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept answer.');
    }
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);
    setReplyError(null);
    try {
      const payload = {
        body: replyBody.trim(),
        anonymous: replyAnon,
        parentReplyId: parentReply ? parentReply.id : null,
      };
      const res = await communityApi.createReply(post.id, payload);
      const newReply = res.data.data || res.data;
      setReplies(rs => [...rs, newReply]);
      setReplyBody('');
      setParentReply(null);
      setReplyAnon(false);
      onPostUpdated({ ...post, replyCount: (post.replyCount || 0) + 1 });
    } catch (err) {
      setReplyError(err.response?.data?.message || 'Failed to submit reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      await communityApi.deleteReply(replyId);
      setReplies(rs => rs.filter(r => r.id !== replyId));
      onPostUpdated({ ...post, replyCount: Math.max(0, (post.replyCount || 1) - 1) });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete reply');
    }
  };

  // Find accepted reply if any
  const acceptedReply = post.acceptedReplyId ? replies.find(r => r.id === post.acceptedReplyId) : null;
  const regularReplies = replies.filter(r => !parentReply && r.id !== post.acceptedReplyId);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Navigation bar */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <button
          id="back-to-feed-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-bit-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to BIT Community</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCopyLink(post.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Copy Link</span>
          </button>
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => onPostDeleted(post.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Post Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {post.isPinned && (
          <div className="flex items-center gap-1.5 px-5 py-1.5 bg-amber-100/70 border-b border-amber-200 text-amber-900 text-xs font-semibold">
            <Pin className="w-3.5 h-3.5 text-amber-700" />
            <span>Pinned Community Announcement</span>
          </div>
        )}

        <div className="p-5 sm:p-7">
          {/* Status & tags header */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <TypeBadge type={post.contentType} />
            {post.contentType === 'QUESTION' && (
              post.isSolved ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-green-100 text-green-800 border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Solved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                  Open Question
                </span>
              )
            )}
            {post.contentType === 'OPPORTUNITY' && (
              <OpportunityBadge status={post.opportunityModerationStatus} />
            )}
            {post.departmentName && (
              <span className="text-xs text-slate-600 flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {post.departmentName}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-3">
            {post.title}
          </h1>

          {/* Author info & timestamps */}
          <div className="flex items-center gap-2.5 mb-5 text-xs text-slate-500 pb-4 border-b border-slate-100">
            {post.isAnonymous ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
            ) : post.authorPhotoUrl ? (
              <img
                src={post.authorPhotoUrl}
                alt={post.authorName}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-bit-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {(post.authorName || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">
                  {post.isAnonymous ? 'Anonymous' : (post.authorName || 'BIT Member')}
                </span>
                {!post.isAnonymous && <AuthorBadge roles={post.authorRoles ? Object.values(post.authorRoles) : []} />}
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                {post.authorDesignation && !post.isAnonymous && (
                  <>
                    <span className="text-slate-600">{post.authorDesignation}</span>
                    <span>•</span>
                  </>
                )}
                <span>Published {formatRelative(post.createdAt)}</span>
                {post.updatedAt !== post.createdAt && <span>(edited)</span>}
              </div>
            </div>
          </div>

          {/* Post Description / Body */}
          <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap mb-6 font-normal">
            {post.body}
          </div>

          {/* Structured Opportunity Card */}
          {post.contentType === 'OPPORTUNITY' && (
            <div className="mb-6 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                  Opportunity Details
                </h2>
                <OpportunityBadge status={post.opportunityModerationStatus} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm">
                {post.opportunityCompany && (
                  <div>
                    <span className="text-slate-400 text-xs block">Company</span>
                    <span className="font-semibold text-slate-900">{post.opportunityCompany}</span>
                  </div>
                )}
                {post.opportunityRole && (
                  <div>
                    <span className="text-slate-400 text-xs block">Role</span>
                    <span className="font-semibold text-slate-900">{post.opportunityRole}</span>
                  </div>
                )}
                {post.opportunityType && (
                  <div>
                    <span className="text-slate-400 text-xs block">Type</span>
                    <span className="font-medium text-slate-800 capitalize">{post.opportunityType}</span>
                  </div>
                )}
                {post.opportunityLocation && (
                  <div>
                    <span className="text-slate-400 text-xs block">Location</span>
                    <span className="font-medium text-slate-800">{post.opportunityLocation}</span>
                  </div>
                )}
                {post.opportunityDeadline && (
                  <div>
                    <span className="text-slate-400 text-xs block">Deadline</span>
                    <span className="font-medium text-slate-800">{new Date(post.opportunityDeadline).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
                {post.opportunityCompensation && (
                  <div>
                    <span className="text-slate-400 text-xs block">Compensation / Stipend</span>
                    <span className="font-medium text-slate-800">{post.opportunityCompensation}</span>
                  </div>
                )}
              </div>

              {post.opportunityEligibility && (
                <div className="pt-2 border-t border-slate-200 text-xs sm:text-sm">
                  <span className="text-slate-400 text-xs block">Eligibility Criteria</span>
                  <p className="text-slate-700 mt-0.5">{post.opportunityEligibility}</p>
                </div>
              )}

              {post.opportunityApplyUrl && (
                <div className="pt-2">
                  <a
                    href={post.opportunityApplyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    id={`apply-external-link-${post.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <span>Apply / View Official Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {post.tags && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {post.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                <span
                  key={tag}
                  className="text-xs text-bit-700 bg-bit-50 border border-bit-200 px-2.5 py-0.5 rounded-md font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Post Engagement Bar */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100 text-xs sm:text-sm">
            <button
              type="button"
              id={`detail-upvote-btn-${post.id}`}
              onClick={() => onUpvote(post.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                post.hasUpvoted
                  ? 'bg-bit-50 text-bit-700 border-bit-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ChevronUp className={`w-4 h-4 ${post.hasUpvoted ? 'text-bit-700 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>{post.upvoteCount} {post.upvoteCount === 1 ? 'Upvote' : 'Upvotes'}</span>
            </button>

            <span className="flex items-center gap-1.5 text-slate-500">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>{post.replyCount} {post.replyCount === 1 ? 'Reply' : 'Replies'}</span>
            </span>

            <span className="flex items-center gap-1.5 text-slate-400">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount} Views</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Prominently Featured Accepted Answer (for Questions) ─────────── */}
      {post.contentType === 'QUESTION' && acceptedReply && (
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Accepted Best Answer</span>
            </div>
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={() => handleAcceptReply(acceptedReply.id)}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-medium underline"
              >
                Unaccept
              </button>
            )}
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(acceptedReply.authorName || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-slate-900 text-xs">
                  {acceptedReply.isAnonymous ? 'Anonymous' : (acceptedReply.authorName || 'BIT Member')}
                </span>
                {!acceptedReply.isAnonymous && <AuthorBadge roles={acceptedReply.authorRoles ? Object.values(acceptedReply.authorRoles) : []} />}
                <span className="text-slate-400 text-[11px]">· {formatRelative(acceptedReply.createdAt)}</span>
              </div>
              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                {acceptedReply.body}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Replies Section ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-semibold text-slate-800 text-sm">
            {post.contentType === 'QUESTION' ? 'Answers & Solutions' : 'Discussion Replies'}
            <span className="ml-2 text-xs font-normal text-slate-500">({replies.length})</span>
          </h2>
          <button
            type="button"
            title="Refresh replies"
            onClick={loadReplies}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {repliesLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-bit-600" />
          </div>
        ) : replies.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No replies yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {post.contentType === 'QUESTION' ? 'Have an answer or advice? Share it below.' : 'Be the first to join the conversation.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {regularReplies.map(reply => (
              <div key={reply.id} id={`reply-item-${reply.id}`} className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {(reply.authorName || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">
                          {reply.isAnonymous ? 'Anonymous' : (reply.authorName || 'BIT Member')}
                        </span>
                        {!reply.isAnonymous && <AuthorBadge roles={reply.authorRoles ? Object.values(reply.authorRoles) : []} />}
                        <span className="text-slate-400 text-[11px]">· {formatRelative(reply.createdAt)}</span>
                      </div>

                      {/* Delete reply if owner or admin */}
                      {(isOwnerOrAdmin || (currentUserId && reply.authorId === currentUserId)) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReply(reply.id)}
                          className="text-slate-400 hover:text-red-600 p-0.5 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap mb-2.5">
                      {reply.body}
                    </p>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        type="button"
                        id={`upvote-reply-${reply.id}`}
                        onClick={() => handleToggleReplyUpvote(reply.id)}
                        className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                          reply.hasUpvoted ? 'text-bit-700 font-semibold' : 'text-slate-500 hover:text-bit-700'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{reply.upvoteCount}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setParentReply({ id: reply.id, authorName: reply.authorName || 'this reply' });
                          replyInputRef.current?.focus();
                        }}
                        className="text-slate-500 hover:text-bit-700 transition-colors inline-flex items-center gap-1"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>Reply</span>
                      </button>

                      {/* Accept Answer button for question owner / admin */}
                      {post.contentType === 'QUESTION' && isOwnerOrAdmin && !post.isSolved && (
                        <button
                          type="button"
                          id={`accept-answer-btn-${reply.id}`}
                          onClick={() => handleAcceptReply(reply.id)}
                          className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept as Solution</span>
                        </button>
                      )}
                    </div>

                    {/* Nested Replies (1-level deep) */}
                    {replies.filter(nr => nr.parentReplyId === reply.id).length > 0 && (
                      <div className="mt-3 pl-3 border-l-2 border-slate-200 space-y-2.5">
                        {replies.filter(nr => nr.parentReplyId === reply.id).map(nested => (
                          <div key={nested.id} className="text-xs">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-slate-800 text-[11px]">
                                {nested.isAnonymous ? 'Anonymous' : (nested.authorName || 'BIT Member')}
                              </span>
                              {!nested.isAnonymous && <AuthorBadge roles={nested.authorRoles ? Object.values(nested.authorRoles) : []} />}
                              <span className="text-slate-400 text-[10px]">· {formatRelative(nested.createdAt)}</span>
                            </div>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{nested.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Reply Input Composer ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-slate-800">
            {parentReply ? (
              <span className="flex items-center gap-1.5 text-bit-700">
                <CornerDownRight className="w-3.5 h-3.5" />
                Replying to {parentReply.authorName}
                <button
                  type="button"
                  onClick={() => setParentReply(null)}
                  className="text-slate-400 hover:text-slate-600 font-normal ml-2"
                >
                  (cancel)
                </button>
              </span>
            ) : post.contentType === 'QUESTION' ? (
              'Contribute an Answer'
            ) : (
              'Leave a Reply'
            )}
          </label>
        </div>

        <form onSubmit={submitReply} className="space-y-3">
          <textarea
            ref={replyInputRef}
            id="reply-textarea"
            rows={3}
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            placeholder={
              post.contentType === 'QUESTION'
                ? 'Explain your solution or share insights to help solve this doubt...'
                : 'Share your perspective or experience...'
            }
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-bit-500 focus:ring-2 focus:ring-bit-100 outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 resize-none transition-all"
          />

          {replyError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {replyError}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                id="reply-anonymous-toggle"
                type="checkbox"
                checked={replyAnon}
                onChange={e => setReplyAnon(e.target.checked)}
                className="rounded border-slate-300 text-bit-600 focus:ring-bit-500"
              />
              <span>Reply anonymously</span>
            </label>

            <button
              id="submit-reply-btn"
              type="submit"
              disabled={submitting || !replyBody.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-bit-600 hover:bg-bit-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{submitting ? 'Submitting…' : 'Post Reply'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Post Modal ────────────────────────────────────────────────────────

function CreatePostModal({ departments, onClose, onCreated }) {
  const [selectedType, setSelectedType] = useState('QUESTION');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [tags, setTags] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  // Opportunity-specific fields
  const [opportunityCompany, setOpportunityCompany] = useState('');
  const [opportunityRole, setOpportunityRole] = useState('');
  const [opportunityLocation, setOpportunityLocation] = useState('');
  const [opportunityType, setOpportunityType] = useState('Internship');
  const [opportunityDeadline, setOpportunityDeadline] = useState('');
  const [opportunityApplyUrl, setOpportunityApplyUrl] = useState('');
  const [opportunityEligibility, setOpportunityEligibility] = useState('');
  const [opportunityCompensation, setOpportunityCompensation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const activeMeta = POST_TYPES.find(p => p.type === selectedType) || POST_TYPES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your post.');
      return;
    }
    if (!body.trim()) {
      setError('Please provide a description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        contentType: selectedType,
        title: title.trim(),
        body: body.trim(),
        departmentId: departmentId ? parseInt(departmentId) : null,
        tags: tags.trim() || null,
        anonymous,
      };

      if (selectedType === 'OPPORTUNITY') {
        Object.assign(payload, {
          opportunityCompany: opportunityCompany.trim() || null,
          opportunityRole: opportunityRole.trim() || null,
          opportunityLocation: opportunityLocation.trim() || null,
          opportunityType: opportunityType.trim() || null,
          opportunityDeadline: opportunityDeadline || null,
          opportunityApplyUrl: opportunityApplyUrl.trim() || null,
          opportunityEligibility: opportunityEligibility.trim() || null,
          opportunityCompensation: opportunityCompensation.trim() || null,
        });
      }

      const res = await communityApi.createPost(payload);
      const newPost = res.data.data || res.data;
      onCreated(newPost);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post. Please check your inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Create Community Post</h2>
            <p className="text-xs text-slate-500">Share with the BIT students, alumni, and faculty</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Post Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {POST_TYPES.map(pt => {
                const Icon = pt.icon;
                const active = selectedType === pt.type;
                return (
                  <button
                    key={pt.type}
                    type="button"
                    id={`type-btn-${pt.type.toLowerCase()}`}
                    onClick={() => { setSelectedType(pt.type); setError(null); }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'border-bit-600 bg-bit-50 text-bit-800 shadow-xs ring-1 ring-bit-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="create-post-title"
              type="text"
              required
              maxLength={300}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={activeMeta.titlePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-bit-500 focus:ring-2 focus:ring-bit-100 outline-none text-sm text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>

          {/* Body / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="create-post-body"
              required
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={activeMeta.descPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-bit-500 focus:ring-2 focus:ring-bit-100 outline-none text-sm text-slate-800 placeholder-slate-400 resize-none transition-all"
            />
          </div>

          {/* Opportunity-specific fields */}
          {selectedType === 'OPPORTUNITY' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                Opportunity Details (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Company / Organization</label>
                  <input
                    id="opp-company-input"
                    type="text"
                    value={opportunityCompany}
                    onChange={e => setOpportunityCompany(e.target.value)}
                    placeholder="e.g., Zoho Corporation"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:border-bit-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Role / Position</label>
                  <input
                    id="opp-role-input"
                    type="text"
                    value={opportunityRole}
                    onChange={e => setOpportunityRole(e.target.value)}
                    placeholder="e.g., SDE Intern"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:border-bit-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Opportunity Type</label>
                  <select
                    id="opp-type-select"
                    value={opportunityType}
                    onChange={e => setOpportunityType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:border-bit-500 outline-none"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time Job</option>
                    <option value="Referral">Alumni Referral</option>
                    <option value="Hackathon">Hackathon / Competition</option>
                    <option value="Workshop">Workshop / Technical Event</option>
                    <option value="Scholarship">Scholarship / Higher Studies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Location</label>
                  <input
                    id="opp-location-input"
                    type="text"
                    value={opportunityLocation}
                    onChange={e => setOpportunityLocation(e.target.value)}
                    placeholder="e.g., Remote or Chennai"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:border-bit-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Application URL</label>
                  <input
                    id="opp-url-input"
                    type="url"
                    value={opportunityApplyUrl}
                    onChange={e => setOpportunityApplyUrl(e.target.value)}
                    placeholder="https://careers.example.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:border-bit-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Application Deadline</label>
                  <input
                    id="opp-deadline-input"
                    type="date"
                    value={opportunityDeadline}
                    onChange={e => setOpportunityDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:border-bit-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Eligibility Criteria</label>
                <input
                  id="opp-eligibility-input"
                  type="text"
                  value={opportunityEligibility}
                  onChange={e => setOpportunityEligibility(e.target.value)}
                  placeholder="e.g., 2026 Batch B.Tech IT / CSE, No Standing Arrears"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:border-bit-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Compensation / Stipend (Optional)</label>
                <input
                  id="opp-compensation-input"
                  type="text"
                  value={opportunityCompensation}
                  onChange={e => setOpportunityCompensation(e.target.value)}
                  placeholder="e.g., ₹25,000 / month"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:border-bit-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Department & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department Scope (Optional)</label>
              <select
                id="post-dept-select"
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:border-bit-500 outline-none"
              >
                <option value="">Visible to all departments (Global)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tags (Comma-separated, Optional)</label>
              <input
                id="post-tags-input"
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="e.g., placement, interview, python"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:border-bit-500 outline-none"
              />
            </div>
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input
              id="post-anonymous-toggle"
              type="checkbox"
              checked={anonymous}
              onChange={e => setAnonymous(e.target.checked)}
              className="rounded border-slate-300 text-bit-600 focus:ring-bit-500"
            />
            <span className="text-xs text-slate-700 font-medium">
              Post anonymously (your name and profile will be hidden from other community members)
            </span>
          </label>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-post-btn"
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-bit-600 hover:bg-bit-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{submitting ? 'Publishing…' : 'Publish Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Community Page ──────────────────────────────────────────────────────

export const CommunityPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 0, totalPages: 1, totalElements: 0, isLast: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);

  // Active Filters & Sorting
  const [activeType, setActiveType] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [sortBy, setSortBy] = useState('LATEST');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Modals & Panels
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('ROLE_ADMIN');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load departments once
  useEffect(() => {
    campusVisitApi.getDepartments()
      .then(res => setDepartments((res.data.data || res.data) || []))
      .catch(() => {});
  }, []);

  // Fetch posts from backend
  const loadPosts = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size: 15,
        sortBy,
      };
      if (activeType) params.contentType = activeType;
      if (deptFilter) params.departmentId = deptFilter;
      if (keyword)    params.keyword      = keyword;

      const res = await communityApi.getPosts(params);
      const data = res.data.data || res.data;
      setPosts(data.content || []);
      setPageInfo({
        page: data.pageNumber ?? 0,
        totalPages: data.totalPages ?? 1,
        totalElements: data.totalElements ?? 0,
        isLast: data.isLast ?? true,
      });
    } catch {
      setError('Failed to load community discussions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeType, deptFilter, sortBy, keyword]);

  useEffect(() => {
    setCurrentPage(0);
    loadPosts(0);
  }, [activeType, deptFilter, sortBy, keyword, loadPosts]);

  // Deep-link check: if URL has ?post=<postId>, open that post
  useEffect(() => {
    const postIdFromUrl = searchParams.get('post');
    if (postIdFromUrl && !selectedPost) {
      communityApi.getPostById(postIdFromUrl)
        .then(res => {
          const p = res.data.data || res.data;
          setSelectedPost(p);
        })
        .catch(() => {
          // ignore or clear param
        });
    }
  }, [searchParams, selectedPost]);

  const handleSelectPost = (post) => {
    setSelectedPost(post);
    setSearchParams({ post: post.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToFeed = () => {
    setSelectedPost(null);
    setSearchParams({});
    loadPosts(currentPage);
  };

  const handleToggleUpvote = async (postId) => {
    try {
      const res = await communityApi.togglePostUpvote(postId);
      const updated = res.data.data || res.data;
      setPosts(ps => ps.map(p => p.id === postId ? { ...p, ...updated } : p));
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => ({ ...prev, ...updated }));
      }
    } catch { /* ignore */ }
  };

  const handleCopyLink = (postId) => {
    const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    navigator.clipboard.writeText(url);
    showToast('Discussion link copied to clipboard!');
  };

  const handlePostCreated = (newPost) => {
    setPosts(ps => [newPost, ...ps]);
    showToast('Post created successfully!');
  };

  const handlePostDeleted = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await communityApi.deletePost(postId);
      setPosts(ps => ps.filter(p => p.id !== postId));
      if (selectedPost?.id === postId) {
        handleBackToFeed();
      }
      showToast('Post deleted successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {selectedPost ? (
        /* ─── Detail View ─────────────────────────────────────────────────── */
        <PostDetailView
          post={selectedPost}
          onBack={handleBackToFeed}
          onUpvote={handleToggleUpvote}
          onCopyLink={handleCopyLink}
          userRoles={userRoles}
          currentUserId={user?.id}
          onPostUpdated={updated => {
            setSelectedPost(updated);
            setPosts(ps => ps.map(p => p.id === updated.id ? { ...p, ...updated } : p));
          }}
          onPostDeleted={handlePostDeleted}
        />
      ) : (
        /* ─── Main Forum Feed View ────────────────────────────────────────── */
        <>
          {/* Header Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">BIT Community</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Connect with BIT students, alumni, and faculty. Ask questions, share experiences, and learn from one another.
              </p>
            </div>
            <button
              id="create-post-btn"
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-bit-600 hover:bg-bit-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </button>
          </div>

          {/* Filter & Sorting Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            {/* Content-Type Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {FILTER_TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeType === tab.value;
                return (
                  <button
                    key={tab.value}
                    id={`filter-tab-${tab.value.toLowerCase() || 'all'}`}
                    type="button"
                    onClick={() => setActiveType(tab.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                      active
                        ? 'bg-bit-600 text-white border-bit-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search, Department, and Sorting Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="sm:col-span-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="community-search-input"
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search by title, description, or tags..."
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 bg-white focus:border-bit-500 focus:ring-1 focus:ring-bit-500 outline-none transition-all"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => { setKeyword(''); setSearchInput(''); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Department Filter */}
              <div className="sm:col-span-3">
                <select
                  id="community-dept-select"
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:border-bit-500 outline-none"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div className="sm:col-span-3">
                <select
                  id="community-sort-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:border-bit-500 outline-none"
                >
                  {SORT_OPTIONS.map(so => (
                    <option key={so.value} value={so.value}>{so.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary & Error Banner */}
          {!loading && (
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Showing <strong className="text-slate-700 font-semibold">{posts.length}</strong> of{' '}
                <strong className="text-slate-700 font-semibold">{pageInfo.totalElements}</strong> discussions
                {keyword && <> matching &ldquo;{keyword}&rdquo;</>}
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </span>
              <button
                type="button"
                onClick={() => loadPosts(currentPage)}
                className="underline font-semibold hover:text-red-900 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Feed List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-4 bg-slate-200 rounded" />
                    <div className="w-24 h-4 bg-slate-100 rounded" />
                  </div>
                  <div className="w-3/4 h-5 bg-slate-200 rounded" />
                  <div className="w-full h-3 bg-slate-100 rounded" />
                  <div className="w-1/2 h-3 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No discussions found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {keyword || activeType || deptFilter
                  ? 'No posts matched your current search or filter criteria. Try clearing some filters.'
                  : 'There are no posts in the community yet. Be the first to start a conversation!'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (keyword || activeType || deptFilter) {
                    setKeyword('');
                    setSearchInput('');
                    setActiveType('');
                    setDeptFilter('');
                  } else {
                    setShowCreateModal(true);
                  }
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-bit-600 hover:bg-bit-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                {keyword || activeType || deptFilter ? (
                  'Clear Filters'
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Post</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSelect={handleSelectPost}
                  onToggleUpvote={handleToggleUpvote}
                  onCopyLink={handleCopyLink}
                  currentUserId={user?.id}
                  isAdmin={isAdmin}
                  onEdit={() => {}}
                  onDelete={handlePostDeleted}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 pb-2">
              <button
                type="button"
                id="prev-page-btn"
                disabled={currentPage === 0}
                onClick={() => {
                  const p = currentPage - 1;
                  setCurrentPage(p);
                  loadPosts(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="text-xs text-slate-500 px-2">
                Page {currentPage + 1} of {pageInfo.totalPages}
              </span>

              <button
                type="button"
                id="next-page-btn"
                disabled={pageInfo.isLast}
                onClick={() => {
                  const p = currentPage + 1;
                  setCurrentPage(p);
                  loadPosts(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Post Creator Modal */}
      {showCreateModal && (
        <CreatePostModal
          departments={departments}
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default CommunityPage;
