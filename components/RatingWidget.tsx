'use client';

import { useEffect, useState } from 'react';

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

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(value)}
      <span className="text-gray-300">{'★'.repeat(5 - value)}</span>
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
      <div className="mt-4 rounded bg-gray-50 p-4 text-sm text-gray-500">
        Loading ratings...
      </div>
    );
  }

  return (
    <div className="mt-4 rounded bg-gray-50 p-4">
      <h4 className="font-medium text-gray-900">Ratings & feedback</h4>

      {error && (
        <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="mt-3">
        {myRating ? (
          <div className="text-sm text-gray-700">
            <p>
              <b>Your rating ({CATEGORY_LABEL[myRating.category]}):</b>{' '}
              <span className="text-amber-500">
                <Stars value={myRating.score} />
              </span>
            </p>

            {myRating.comment && (
              <p className="mt-1 italic text-gray-600">
                &ldquo;{myRating.comment}&rdquo;
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-700">
              Rate the {CATEGORY_LABEL[
                myRole === 'shelter'
                  ? 'food_condition'
                  : myRole === 'donor'
                    ? 'pickup_coordination'
                    : 'pickup_delivery_experience'
              ].toLowerCase()}:
            </p>

            <div className="mt-2 flex items-center gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => setSelectedScore(starValue)}
                  onMouseEnter={() => setHoverScore(starValue)}
                  onMouseLeave={() => setHoverScore(0)}
                  className={
                    starValue <= (hoverScore || selectedScore)
                      ? 'text-amber-500'
                      : 'text-gray-300'
                  }
                  aria-label={`Rate ${starValue} star${starValue === 1 ? '' : 's'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Optional comment"
              maxLength={500}
              className="mt-2 w-full rounded border border-gray-300 p-2 text-sm text-black"
            />

            <button
              type="button"
              onClick={submitRating}
              disabled={submitting}
              className="mt-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit rating'}
            </button>
          </div>
        )}
      </div>

      {otherRatings.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-gray-200 pt-3">
          {otherRatings.map((rating) => (
            <div key={rating._id} className="text-sm text-gray-700">
              <p>
                <b>
                  {ROLE_LABEL[rating.raterRole]} rated{' '}
                  {CATEGORY_LABEL[rating.category].toLowerCase()}:
                </b>{' '}
                <span className="text-amber-500">
                  <Stars value={rating.score} />
                </span>
              </p>

              {rating.comment && (
                <p className="italic text-gray-600">
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