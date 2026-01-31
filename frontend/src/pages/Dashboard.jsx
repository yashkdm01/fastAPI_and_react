import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../api/axios";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get("/projects/");
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/auth/users");
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const handleMemberToggle = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const onSubmit = async (data) => {
    try {
      await api.post("/projects/", {
        ...data,
        member_ids: selectedMembers,
      });
      await fetchProjects();
      reset();
      setSelectedMembers([]);
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to create project");
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Are you sure? This will delete all tickets and data!"))
      return;

    try {
      await api.delete(`/projects/${projectId}`);
      await fetchProjects();
    } catch (err) {
      alert("Only the project owner can delete this.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Projects
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
        >
          + New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-10">
            No projects found. Create one to get started!
          </p>
        )}

        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/project/${project.id}`}
            className="block bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">
                {project.name}
              </h3>

              <button
                onClick={(e) => handleDeleteProject(e, project.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                title="Delete Project"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm line-clamp-2">
              {project.description || "No description provided."}
            </p>

            {/* member avatars on card */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Members:
              </span>
              <div className="flex -space-x-2">
                {project.members?.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] text-purple-700 dark:text-purple-300 font-bold"
                    title={m.email}
                  >
                    {m.email.charAt(0).toUpperCase()}
                  </div>
                ))}
                {project.members?.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                    +{project.members.length - 4}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Create Project
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input
                  {...register("name", {
                    required: "Project name is required",
                  })}
                  className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Project Name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <textarea
                {...register("description")}
                className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Description"
                rows="3"
              />

              {/* member selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign Members
                </label>
                <div className="border dark:border-gray-600 rounded-md p-2 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700/50">
                  {users.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center p-2">
                      No other users found.
                    </p>
                  ) : (
                    users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2 mb-2 last:mb-0"
                      >
                        <input
                          type="checkbox"
                          id={`user-${u.id}`}
                          checked={selectedMembers.includes(u.id)}
                          onChange={() => handleMemberToggle(u.id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`user-${u.id}`}
                          className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                        >
                          {u.email}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
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
