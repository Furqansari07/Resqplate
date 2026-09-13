'use client';

import { useEffect, useState } from 'react';
import { Star, MessageSquareQuote } from 'lucide-react';

type RaterRole = 'donor' | 'volunteer' | 'shelter';

type Rating = {
  _id: string;
  raterRole: RaterRole;
  category: string;
  score: number;
  comment?: string;
  raterId?: { name?: string };
  createdAt: string;
};

const ROLE_LABEL: Record<RaterRole, string> = {
  donor: 'Donor',
  volunteer: 'Volunteer',
  shelter: 'Shelter',
};

const CATEGORY_LABEL: Record<string, string> = {
  food_condition: 'Food condition',
  pickup_coordination: 'Pickup coordination',
  pickup_delivery_experience: 'Pickup & delivery experience',
};

function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={n <= value ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'fill-transparent text-[var(--foreground-subtle)]'}
        />
      ))}
    </span>
  );
}

export default function RatingWidget({
  donationId,
  myRole,
}: {
  donationId: string;
  myRole: RaterRole;
}) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedScore, setSelectedScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRatings = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/donations/${donationId}/rating`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to load ratings.');
        return;
      }

      setRatings(data.ratings);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donationId]);

  const myRating = ratings.find((rating) => rating.raterRole === myRole);
  const otherRatings = ratings.filter((rating) => rating.raterRole !== myRole);

  const submitRating = async () => {
    if (selectedScore < 1) {
      setError('Please select a star rating first.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/donations/${donationId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: selectedScore, comment }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to submit the rating.');
        return;
      }

      setSelectedScore(0);
      setComment('');
      await loadRatings();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--foreground-subtle)]">
        Loading ratings...
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="flex items-center gap-2">
        <MessageSquareQuote className="h-4 w-4 text-[var(--foreground-subtle)]" />
        <h4 className="font-medium text-[var(--foreground)]">Ratings & feedback</h4>
      </div>

      {error && (
        <p className="mt-2 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger-light)] p-2 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="mt-3">
        {myRating ? (
          <div className="text-sm text-[var(--foreground-muted)]">
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-[var(--foreground)]">Your rating ({CATEGORY_LABEL[myRating.category]}):</b>
              <StarRow value={myRating.score} />
            </div>

            {myRating.comment && (
              <p className="mt-1 italic text-[var(--foreground-subtle)]">
                &ldquo;{myRating.comment}&rdquo;
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-[var(--foreground-muted)]">
              Rate the {CATEGORY_LABEL[
                myRole === 'shelter'
                  ? 'food_condition'
                  : myRole === 'donor'
                    ? 'pickup_coordination'
                    : 'pickup_delivery_experience'
              ].toLowerCase()}:
            </p>

            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => setSelectedScore(starValue)}
                  onMouseEnter={() => setHoverScore(starValue)}
                  onMouseLeave={() => setHoverScore(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                  aria-label={`Rate ${starValue} star${starValue === 1 ? '' : 's'}`}
                >
                  <Star
                    width={22}
                    height={22}
                    className={
                      starValue <= (hoverScore || selectedScore)
                        ? 'fill-[var(--color-accent)] text-[var(--color-accent)]'
                        : 'fill-transparent text-[var(--foreground-subtle)]'
                    }
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Optional comment"
              maxLength={500}
              className="input mt-2 min-h-20 resize-none"
            />

            <button
              type="button"
              onClick={submitRating}
              disabled={submitting}
              className="btn-primary mt-2 text-sm"
            >
              {submitting ? 'Submitting...' : 'Submit rating'}
            </button>
          </div>
        )}
      </div>

      {otherRatings.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-3">
          {otherRatings.map((rating) => (
            <div key={rating._id} className="text-sm text-[var(--foreground-muted)]">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-[var(--foreground)]">
                  {ROLE_LABEL[rating.raterRole]} rated {CATEGORY_LABEL[rating.category].toLowerCase()}:
                </b>
                <StarRow value={rating.score} />
              </div>

              {rating.comment && (
                <p className="italic text-[var(--foreground-subtle)]">
                  &ldquo;{rating.comment}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}