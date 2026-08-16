import { WeeklyReviewView } from '@/components/weekly-review-view';
import { demoSnapshot } from '@/lib/demo/snapshot';

export default function WeeklyReviewPage() {
  return <WeeklyReviewView review={demoSnapshot.weeklyReview} />;
}
