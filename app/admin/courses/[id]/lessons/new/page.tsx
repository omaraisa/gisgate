import CourseLessonEditor from '../[lessonId]/edit/page'

export default function NewCourseLessonPage() {
  return <CourseLessonEditor params={Promise.resolve({ id: 'new', lessonId: 'new' })} />
}