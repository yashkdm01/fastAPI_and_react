import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects/');
      setProjects(data);
    } catch (error) { console.error("Failed to fetch projects", error); }
  };

  const onSubmit = async (data) => {
    try {
      await api.post('/projects/', data);
      await fetchProjects();
      reset();
      setIsModalOpen(false);
    } catch (error) { alert("Failed to create project"); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Project
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link key={project.id} to={`/project/${project.id}`} className="block bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all">
            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
            <p className="text-gray-500 mt-2 text-sm line-clamp-2">{project.description}</p>
          </Link>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create Project</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input {...register('name')} className="w-full border p-2 rounded" placeholder="Project Name" />
              <textarea {...register('description')} className="w-full border p-2 rounded" placeholder="Description" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}