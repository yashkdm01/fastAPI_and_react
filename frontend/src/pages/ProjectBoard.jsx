import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../api/axios';

const getPriorityColor = (p) => {
  if (p === 'HIGH') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  if (p === 'MEDIUM') return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
  return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
};

export default function ProjectBoard() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]); 
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const { register, handleSubmit, reset, setValue } = useForm();
  
  // NEW: State for the Comment Input
  const [newComment, setNewComment] = useState("");

  // Fetch when filters change
  useEffect(() => {
    fetchProjectDetails();
  }, [projectId, searchQuery, priorityFilter]); 

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (editingTicket) {
      setValue('title', editingTicket.title);
      setValue('description', editingTicket.description);
      setValue('priority', editingTicket.priority);
      setValue('assignee_id', editingTicket.assignee_id || "");
    } else {
      reset();
      setNewComment(""); // Clear comment box when closing
    }
  }, [editingTicket, setValue, reset]);

  const fetchProjectDetails = async () => {
    try {
      console.log(`Fetching Board for Project: ${projectId}`);
      const { data } = await api.get(`/projects/${projectId}`, {
        params: {
          search: searchQuery,
          priority: priorityFilter
        }
      });
      setProject(data);
      setTickets(data.tickets);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch (err) { console.error(err); }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // 1. Optimistic Update
    const newStatus = destination.droppableId;
    const movedTicketId = parseInt(draggableId);
    const originalTickets = [...tickets];

    setTickets(tickets.map(t => t.id === movedTicketId ? { ...t, status: newStatus } : t));

    try {
      // 2. Send Request
      await api.patch(`/projects/${projectId}/tickets/${movedTicketId}`, { status: newStatus });
    } catch (error) { 
      // 3. Rollback
      console.error("Move Failed! Reverting...", error);
      alert("Failed to update status. Check connection.");
      setTickets(originalTickets);
    }
  };

  const onSubmit = async (data) => {
    const payload = { ...data };
    if (payload.assignee_id === "" || payload.assignee_id === null) {
      payload.assignee_id = null;
    } else {
      payload.assignee_id = parseInt(payload.assignee_id, 10);
    }
    
    try {
      if (editingTicket) {
        await api.patch(`/projects/${projectId}/tickets/${editingTicket.id}`, payload);
      } else {
        await api.post(`/projects/${projectId}/tickets`, { ...payload, status: "TODO" });
      }
      await fetchProjectDetails();
      closeModals();
    } catch (error) {
      console.error("Error creating/updating ticket:", error);
      alert(`Operation failed: ${error.response?.data?.detail || error.message}`);
    }
  };

  const onAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data } = await api.post(`/projects/${projectId}/tickets/${editingTicket.id}/comments`, {
        content: newComment
      });

      // Update Local State (Immediate Feedback)
      const updatedTicket = { 
        ...editingTicket, 
        comments: [...(editingTicket.comments || []), data] 
      };
      
      setEditingTicket(updatedTicket);
      
      // Update Board State so comments stick if we close/reopen
      setTickets(tickets.map(t => t.id === editingTicket.id ? updatedTicket : t));
      
      setNewComment("");
    } catch (error) {
      console.error("Failed to post comment", error);
      alert("Failed to post comment");
    }
  };

  const onDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.delete(`/projects/${projectId}/tickets/${editingTicket.id}`);
      await fetchProjectDetails();
      closeModals();
    } catch (error) { alert("Delete failed"); }
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setEditingTicket(null);
    reset();
  };

  if (!project) return <div className="p-10 text-gray-500 dark:text-gray-400">Loading Project Board...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{project.description}</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm">
          + Create Issue
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <input 
            type="text" 
            placeholder="Search tickets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select 
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
        >
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="LOW">Low Priority</option>
        </select>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 h-full overflow-x-auto pb-4 items-start">
          {['TODO', 'IN_PROGRESS', 'DONE'].map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-w-[320px] w-80 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 flex flex-col border border-transparent dark:border-gray-700/50 max-h-full"
                >
                  <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 text-sm uppercase tracking-wide flex justify-between">
                    {status.replace('_', ' ')}
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full">
                      {tickets.filter(t => t.status === status).length}
                    </span>
                  </h3>
                  
                  <div className="space-y-3 overflow-y-auto pr-1">
                    {tickets.filter(t => t.status === status).map((ticket, index) => (
                        <Draggable key={ticket.id} draggableId={String(ticket.id)} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setEditingTicket(ticket)}
                              className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group"
                              style={{ ...provided.draggableProps.style }}
                            >
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">{ticket.title}</h4>
                              <div className="flex justify-between items-center mt-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getPriorityColor(ticket.priority || 'MEDIUM')}`}>
                                  {ticket.priority || 'MEDIUM'}
                                </span>
                                <div className="flex items-center gap-2">
                                    {/* Show comment count if any */}
                                    {ticket.comments?.length > 0 && (
                                        <div className="flex items-center text-gray-400 text-xs">
                                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                            {ticket.comments.length}
                                        </div>
                                    )}
                                    <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold border border-indigo-100 dark:border-indigo-800">
                                      {(ticket.assignee_id) ? "U" + ticket.assignee_id : "?"}
                                    </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Modal */}
      {(isCreateOpen || editingTicket) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingTicket ? `Edit Issue #${editingTicket.id}` : "Create New Issue"}
              </h2>
              {editingTicket && (
                <button onClick={onDelete} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium">
                  Delete
                </button>
              )}
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input {...register('title', { required: true })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea {...register('description')} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500" rows="3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select {...register('priority')} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md outline-none">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                   <select {...register('assignee_id')} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md outline-none">
                     <option value="">Unassigned</option>
                     {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                   </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm">
                  {editingTicket ? "Save Changes" : "Create Issue"}
                </button>
              </div>
            </form>

            {editingTicket && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                        Activity & Comments
                    </h3>

                    {/* List of Comments */}
                    <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                        {(!editingTicket.comments || editingTicket.comments.length === 0) && (
                            <p className="text-gray-400 text-sm italic">No comments yet. Be the first!</p>
                        )}
                        {editingTicket.comments?.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
                                    U{comment.owner_id}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-gray-900 dark:text-gray-200">User #{comment.owner_id}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex gap-2 items-start">
                        <textarea 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..." 
                            className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[40px]"
                            rows="1"
                        />
                        <button 
                            type="button" 
                            onClick={onAddComment}
                            disabled={!newComment.trim()}
                            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            Post
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
