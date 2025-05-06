import React from 'react';
import { Star } from 'lucide-react';

function UserCard({ name, rating, comment }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md m-2">
      <div className="flex items-center mb-2">
        <p className="font-bold mr-2">{name}</p>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              fill={i < rating ? '#facc15' : 'none'}
              stroke={i < rating ? '#facc15' : '#d1d5db'}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-Grayscale-Gray60">{comment}</p>
    </div>
  );
}

export default UserCard;
