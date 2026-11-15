import PostFeed, { type PostFeedParams } from "@/components/PostFeed";

export default function PostsPage({ searchParams }: { searchParams: PostFeedParams }) {
  return (
    <PostFeed
      title="Посты и вести"
      lead="Публикация интересных нововведений, новостей и предупреждений, с которыми Вы можете ознакомиться в данном разделе."
      action="/posts"
      searchParams={searchParams}
      empty="Пока нет опубликованных постов."
    />
  );
}
