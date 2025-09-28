import LessonEditor from '../[id]/edit/page'

export default function NewLessonPage() {
  return <LessonEditor params={Promise.resolve({ id: 'new' })} />
}