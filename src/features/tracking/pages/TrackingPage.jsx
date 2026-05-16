import TrackingNavbar from '../components/TrackingNavbar';
import TrackingOrderResult from '../components/TrackingOrderResult';
import TrackingSearchCard from '../components/TrackingSearchCard';
import { TrackingInitialState, TrackingLoadingState, TrackingNotFoundState } from '../components/TrackingEmptyState';
import { useTracking } from '../hooks/useTracking';

export default function TrackingPage() {
  const { tracking, setTracking, order, status, error, searchTracking, resetTracking } = useTracking();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <TrackingNavbar />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <TrackingSearchCard
          tracking={tracking}
          setTracking={setTracking}
          status={status}
          error={error}
          onSearch={searchTracking}
          onReset={resetTracking}
        />

        {status === 'idle' ? <TrackingInitialState /> : null}
        {status === 'loading' ? <TrackingLoadingState /> : null}
        {status === 'not_found' ? <TrackingNotFoundState /> : null}
        {status === 'success' && order ? <TrackingOrderResult order={order} /> : null}
      </main>
    </div>
  );
}
