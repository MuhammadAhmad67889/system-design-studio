import { notFound } from 'next/navigation';
import { getAllLessons, getLesson } from '@/lib/content';
import { LessonView } from '@/components/learn/LessonView';

export function generateStaticParams() {
  return getAllLessons().map((lesson) => ({ lessonId: lesson.id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();

  return <LessonView lessonId={lesson.id} />;
}
