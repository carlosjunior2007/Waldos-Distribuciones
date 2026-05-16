import SummaryCard from "../../../components/ui/SummaryCard";

export default function DashboardStats({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {stats.map((item) => (
        <SummaryCard key={item.title} {...item} />
      ))}
    </div>
  );
}
