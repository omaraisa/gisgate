import { create } from 'zustand';
import { useAuthStore } from './auth-store';

export interface Course {
  id: string;
  title: string;
  titleEnglish?: string;
  slug: string;
  description?: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  price?: number;
  currency?: string;
  isFree: boolean;
  isPrivate: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  authorId?: string;
  authorName?: string;
  authorNameEnglish?: string;
  totalLessons: number;
  duration?: string;
  language?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  isCompleted: boolean;
  course: Course;
  lessonProgress: LessonProgress[];
  certificates: Certificate[];
}

export interface LessonProgress {
  id: string;
  lessonId: string;
  watchedTime: number;
  isCompleted: boolean;
  completedAt?: string;
  lastWatchedAt: string;
  lesson: {
    id: string;
    title: string;
    slug: string;
    duration?: string;
    order: number;
  };
}

export interface Certificate {
  id: string;
  certificateId: string;
  templateName: string;
  language: string;
  earnedAt: string;
}

interface CourseState {
  // State
  courses: Course[];
  currentCourse: Course | null;
  enrollments: CourseEnrollment[];
  featuredCourses: Course[];
  categoryCourses: Record<string, Course[]>;

  // Loading states
  loadingCourses: boolean;
  loadingCourse: boolean;
  loadingEnrollments: boolean;
  enrolling: boolean;

  // Errors
  error: string | null;

  // Actions
  // Course listing
  fetchCourses: (filters?: { category?: string; level?: string; search?: string }) => Promise<void>;
  fetchFeaturedCourses: () => Promise<void>;
  fetchCoursesByCategory: (category: string) => Promise<void>;

  // Single course
  fetchCourse: (slug: string) => Promise<Course | null>;
  setCurrentCourse: (course: Course | null) => void;

  // Enrollment
  fetchEnrollments: () => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<boolean>;
  checkEnrollmentStatus: (courseId: string) => boolean;

  // Progress
  updateLessonProgress: (courseId: string, lessonId: string, watchedTime: number, isCompleted?: boolean) => Promise<void>;
  getLessonProgress: (courseId: string, lessonId: string) => LessonProgress | null;

  // Utility
  clearError: () => void;
  setLoading: (key: string, loading: boolean) => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  // Initial state
  courses: [],
  currentCourse: null,
  enrollments: [],
  featuredCourses: [],
  categoryCourses: {},

  loadingCourses: false,
  loadingCourse: false,
  loadingEnrollments: false,
  enrolling: false,

  error: null,

  // Course listing actions
  fetchCourses: async (filters = {}) => {
    try {
      set({ loadingCourses: true, error: null });

      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.level) params.append('level', filters.level);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/courses?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch courses');

      const courses = await response.json();
      set({ courses, loadingCourses: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch courses',
        loadingCourses: false
      });
    }
  },

  fetchFeaturedCourses: async () => {
    try {
      set({ error: null });

      const response = await fetch('/api/courses/featured');
      if (!response.ok) throw new Error('Failed to fetch featured courses');

      const featuredCourses = await response.json();
      set({ featuredCourses });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch featured courses' });
    }
  },

  fetchCoursesByCategory: async (category: string) => {
    try {
      set({ error: null });

      const response = await fetch(`/api/courses?category=${encodeURIComponent(category)}`);
      if (!response.ok) throw new Error('Failed to fetch courses by category');

      const courses = await response.json();
      set((state) => ({
        categoryCourses: {
          ...state.categoryCourses,
          [category]: courses,
        },
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch courses by category' });
    }
  },

  // Single course actions
  fetchCourse: async (slug: string) => {
    try {
      set({ loadingCourse: true, error: null });

      const response = await fetch(`/api/courses/${slug}`);
      if (!response.ok) throw new Error('Failed to fetch course');

      const course = await response.json();
      set({ currentCourse: course, loadingCourse: false });
      return course;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch course',
        loadingCourse: false
      });
      return null;
    }
  },

  setCurrentCourse: (course: Course | null) => {
    set({ currentCourse: course });
  },

  // Enrollment actions
  fetchEnrollments: async () => {
    try {
      set({ loadingEnrollments: true, error: null });

      const { token } = useAuthStore.getState();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch enrollments');

      const data = await response.json();
      set({
        enrollments: data.learningProfile.enrolledCourses,
        loadingEnrollments: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch enrollments',
        loadingEnrollments: false
      });
    }
  },

  enrollInCourse: async (courseId: string) => {
    try {
      set({ enrolling: true, error: null });

      const { token } = useAuthStore.getState();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enroll in course');
      }

      // Refresh enrollments
      await get().fetchEnrollments();

      set({ enrolling: false });
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to enroll in course',
        enrolling: false
      });
      return false;
    }
  },

  checkEnrollmentStatus: (courseId: string) => {
    const enrollments = get().enrollments;
    return enrollments.some(enrollment => enrollment.courseId === courseId);
  },

  // Progress actions
  updateLessonProgress: async (courseId: string, lessonId: string, watchedTime: number, isCompleted = false) => {
    try {
      const { token } = useAuthStore.getState();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/courses/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          lessonId,
          watchedTime,
          isCompleted,
        }),
      });

      if (!response.ok) throw new Error('Failed to update progress');

      // Refresh enrollments to get updated progress
      await get().fetchEnrollments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update progress' });
    }
  },

  getLessonProgress: (courseId: string, lessonId: string) => {
    const enrollments = get().enrollments;
    const enrollment = enrollments.find(e => e.courseId === courseId);
    if (!enrollment) return null;

    return enrollment.lessonProgress.find(lp => lp.lessonId === lessonId) || null;
  },

  // Utility actions
  clearError: () => {
    set({ error: null });
  },

  setLoading: (key: string, loading: boolean) => {
    // This can be extended for more granular loading states
    console.log(`Loading ${key}:`, loading);
  },
}));