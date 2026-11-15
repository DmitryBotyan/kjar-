import PostFeed, { type PostFeedParams } from "@/components/PostFeed";

export const metadata = {
  title: "Расписание — KJÁR"
};

// Расписание собирается из постов с разделом schedule
export default function SchedulePage({ searchParams }: { searchParams: PostFeedParams }) {
  return (
    <PostFeed
      title="Расписание"
      lead="Что и когда происходит в Хеймсвальде: сроки ивентов, наборы и даты обновлений."
      action="/schedule"
      section="schedule"
      searchParams={searchParams}
      empty="Расписание пока не опубликовано."
    />
  );
}
