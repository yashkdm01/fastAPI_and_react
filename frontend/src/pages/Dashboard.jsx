import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { 
    fetchProjects(); 
  }, []);

  const fetchProjects = async () => {
    try {
      console.log("Fetching Projects from:", api.defaults.baseURL);
      
      const { data } = await api.get('/projects/');
      console.log("Projects loaded:", data);
      setProjects(data);
    } catch (error) { 
      console.error("Failed to fetch projects", error); 
    }
  };

  const onSubmit = async (data) => {
    try {
      await api.post('/projects/', data);
      await fetchProjects();
      reset();
      setIsModalOpen(false);
    } catch (error) { 
      alert("Failed to create project"); 
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + New Project
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-10">
                No projects found. Create one to get started!
            </p>
        )}
        
        {projects.map((project) => (
          <Link 
            key={project.id} 
            to={`/project/${project.id}`} 
            className="block bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
            <p className="text-gray-500 mt-2 text-sm line-clamp-2">
                {project.description || "No description provided."}
            </p>
          </Link>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create Project</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Input with Validation */}
              <div>
                <input 
                    {...register('name', { required: "Project name is required" })} 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Project Name" 
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              {/* Description Input */}
              <textarea 
                {...register('description')} 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Description" 
                rows="3"
              />

              <div className="flex justify-end gap-2">
                <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
