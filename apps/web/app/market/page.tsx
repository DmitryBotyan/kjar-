import PostFeed, { type PostFeedParams } from "@/components/PostFeed";

export const metadata = {
  title: "Торговая площадь — KJÁR"
};

// Торговая площадь собирается из постов с разделом market
export default function MarketPage({ searchParams }: { searchParams: PostFeedParams }) {
  return (
    <PostFeed
      title="Торговая площадь"
      lead="Объявления о продаже, обмене и поиске кьяров и всего, что к ним прилагается."
      action="/market"
      section="market"
      searchParams={searchParams}
      empty="На площади пока пусто."
    />
  );
}
