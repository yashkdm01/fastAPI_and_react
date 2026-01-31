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
  
  // search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // modal and mode state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null); 
  const [isEditMode, setIsEditMode] = useState(false); 

  const { register, handleSubmit, reset, setValue } = useForm();
  const [newComment, setNewComment] = useState("");

  // fetch when filter change
  useEffect(() => {
    fetchProjectDetails();
  }, [projectId, searchQuery, priorityFilter]); 

  useEffect(() => {
    if (selectedTicket) {
      setValue('title', selectedTicket.title);
      setValue('description', selectedTicket.description);
      setValue('priority', selectedTicket.priority);
      setValue('assignee_id', selectedTicket.assignee_id || "");
    } else {
      reset();
      setNewComment(""); 
      setIsEditMode(false);
    }
  }, [selectedTicket, isEditMode, setValue, reset]);

  const fetchProjectDetails = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}`, {
        params: {
          search: searchQuery,
          priority: priorityFilter
        }
      });
      setProject(data);
      setTickets(data.tickets);
      setUsers(data.members || []);
    } catch (err) { console.error(err); }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const movedTicketId = parseInt(draggableId);
    const originalTickets = [...tickets];

    setTickets(tickets.map(t => t.id === movedTicketId ? { ...t, status: newStatus } : t));

    try {
      await api.patch(`/projects/${projectId}/tickets/${movedTicketId}`, { status: newStatus });
    } catch (error) { 
      console.error("Move Failed! Reverting...", error);
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
      if (selectedTicket && isEditMode) {
        // updating existing ticket
        await api.patch(`/projects/${projectId}/tickets/${selectedTicket.id}`, payload);
      
        setSelectedTicket({ ...selectedTicket, ...payload });
        setIsEditMode(false); 
      } else {
        // creating new ticket
        await api.post(`/projects/${projectId}/tickets`, { ...payload, status: "TODO" });
        setIsCreateOpen(false);
      }
      await fetchProjectDetails();
    } catch (error) {
      console.error("Error creating/updating ticket:", error);
      alert(`Operation failed: ${error.response?.data?.detail || error.message}`);
    }
  };

  const onAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data } = await api.post(`/projects/${projectId}/tickets/${selectedTicket.id}/comments`, {
        content: newComment
      });

      const updatedTicket = { 
        ...selectedTicket, 
        comments: [...(selectedTicket.comments || []), data] 
      };
      
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setNewComment("");
    } catch (error) {
      console.error("Failed to post comment", error);
      alert("Failed to post comment");
    }
  };

  const onDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.delete(`/projects/${projectId}/tickets/${selectedTicket.id}`);
      await fetchProjectDetails();
      closeModals();
    } catch (error) { alert("Delete failed"); }
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setSelectedTicket(null);
    setIsEditMode(false);
    reset();
  };

  if (!project) return <div className="p-10 text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm">{project.description}</p>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full font-medium">
               <span>👥 {project.members?.length || 0} Members</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm">
          + Create Issue
        </button>
      </div>

      {/* toolbar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <input 
            type="text" 
            placeholder="Search tickets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select 
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
        >
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 h-full overflow-x-auto pb-4 items-start">
          {['todo', 'inprogress', 'done'].map((status) => (
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
                              onClick={() => setSelectedTicket(ticket)}
                              className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
                              style={{ ...provided.draggableProps.style }}
                            >
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400">{ticket.title}</h4>
                              <div className="flex justify-between items-center mt-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getPriorityColor(ticket.priority || 'MEDIUM')}`}>
                                  {ticket.priority || 'MEDIUM'}
                                </span>
                                <div className="flex items-center gap-2">
                                    {ticket.comments?.length > 0 && (
                                        <div className="flex items-center text-gray-400 text-xs">
                                            <span className="mr-1">💬</span>{ticket.comments.length}
                                        </div>
                                    )}
                                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold border border-purple-200 dark:border-purple-800">
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

      
      {isCreateOpen && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700">
               <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Issue</h2>
               <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <input {...register('title', { required: true })} placeholder="Issue Title" className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" autoFocus />
                  <textarea {...register('description')} placeholder="Description" rows="3" className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" />
                  <div className="grid grid-cols-2 gap-4">
                     <select {...register('priority')} className="border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded">
                        <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
                     </select>
                     <select {...register('assignee_id')} className="border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded">
                        <option value="">Unassigned</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                     </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                     <button type="button" onClick={closeModals} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Create</button>
                  </div>
               </form>
            </div>
         </div>
      )}

    
      {selectedTicket && !isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* modal top bar */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
               <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Issue #{selectedTicket.id}</span>
                  {!isEditMode ? (
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 leading-tight">{selectedTicket.title}</h2>
                  ) : (
                     <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">Editing Issue</h2>
                  )}
               </div>
               <div className="flex gap-2">
                  {!isEditMode ? (
                     <>
                        <button onClick={() => setIsEditMode(true)} className="text-gray-500 hover:text-purple-600 px-3 py-1 rounded bg-gray-50 dark:bg-gray-700 text-sm font-medium transition">Edit</button>
                        <button onClick={closeModals} className="text-gray-400 hover:text-gray-600 px-3 py-1 text-2xl leading-none">&times;</button>
                     </>
                  ) : (
                     <button onClick={() => setIsEditMode(false)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel Edit</button>
                  )}
               </div>
            </div>

            {/* scrollable content area */}
            <div className="p-6 overflow-y-auto flex-1">
               {/* view mode */}
               {!isEditMode ? (
                  <div className="space-y-6">
                     {/* metadata badges */}
                     <div className="flex flex-wrap gap-3 text-sm">
                        <span className={`px-2 py-1 rounded border ${getPriorityColor(selectedTicket.priority)}`}>{selectedTicket.priority}</span>
                        <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{selectedTicket.status.replace('_',' ')}</span>
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 ml-auto sm:ml-0">
                           Assigned to: <span className="font-medium text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300">{selectedTicket.assignee_id ? `User #${selectedTicket.assignee_id}` : 'Unassigned'}</span>
                        </span>
                     </div>
                     
                     {/* description */}
                     <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                     </div>

                     {/* comments section */}
                     <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                           Discussion <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 rounded-full">{selectedTicket.comments?.length || 0}</span>
                        </h3>
                        
                        <div className="space-y-6 mb-6">
                           {(!selectedTicket.comments || selectedTicket.comments.length === 0) && (
                              <p className="text-gray-400 text-sm italic">No comments yet.</p>
                           )}
                           {selectedTicket.comments?.map((comment) => (
                              <div key={comment.id} className="flex gap-4 group">
                                 <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300 shrink-0 mt-1">
                                    {comment.owner_id}
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-baseline justify-between mb-1">
                                       <span className="font-semibold text-gray-900 dark:text-white text-sm">User #{comment.owner_id}</span>
                                       <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg rounded-tl-none border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-600 transition-colors">
                                       {comment.content}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>

                        {/* comment input */}
                        <div className="flex gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                           <div className="flex-1">
                              <textarea 
                                 value={newComment}
                                 onChange={(e) => setNewComment(e.target.value)}
                                 placeholder="Write a comment..." 
                                 className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm min-h-[80px]"
                              />
                              <div className="flex justify-end mt-2">
                                 <button 
                                    onClick={onAddComment}
                                    disabled={!newComment.trim()}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                 >
                                    Post Comment
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               ) : (
                  /* edit form*/
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input {...register('title', { required: true })} className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea {...register('description')} rows="5" className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                           <select {...register('priority')} className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded">
                              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                           <select {...register('assignee_id')} className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded">
                              <option value="">Unassigned</option>
                              {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                           </select>
                        </div>
                     </div>
                     <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                        <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Issue</button>
                        <div className="flex gap-2">
                           <button type="button" onClick={() => setIsEditMode(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">Cancel</button>
                           <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">Save Changes</button>
                        </div>
                     </div>
                  </form>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
