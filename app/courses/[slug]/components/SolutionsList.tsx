'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import SolutionSubmissionForm from './SolutionSubmissionForm';
import { ExternalLink, Github, User } from 'lucide-react';

interface Solution {
  id: string;
  title: string;
  description: string;
  sourceCodeUrl?: string;
  demoUrl?: string;
  createdAt: string;
  author: {
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    username: string | null;
  };
}

interface SolutionsListProps {
  courseId: string;
}

export default function SolutionsList({ courseId }: SolutionsListProps) {
  const { user } = useAuthStore();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchSolutions = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/solutions`);
      if (response.ok) {
        const data = await response.json();
        setSolutions(data);
      }
    } catch (error) {
      console.error('Error fetching solutions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolutions();
  }, [courseId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Community Solutions</h2>
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Submit Solution
          </button>
        )}
      </div>

      {showForm && (
        <SolutionSubmissionForm
          courseId={courseId}
          onSuccess={() => {
            setShowForm(false);
            fetchSolutions();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : solutions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-gray-500">No solutions shared yet. Be the first!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {solutions.map((solution) => (
            <div key={solution.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{solution.title}</h3>
                  <p className="text-gray-600 mb-4">{solution.description}</p>
                  
                  <div className="flex gap-4">
                    {solution.sourceCodeUrl && (
                      <a
                        href={solution.sourceCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        <Github className="w-4 h-4" />
                        Source Code
                      </a>
                    )}
                    {solution.demoUrl && (
                      <a
                        href={solution.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {solution.author.avatar ? (
                      <img src={solution.author.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <span>
                    {solution.author.firstName 
                      ? `${solution.author.firstName} ${solution.author.lastName || ''}`
                      : solution.author.username || 'Anonymous'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
