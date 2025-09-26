'use client';

import WordPressMigrator from '../components/WordPressMigrator';

export default function WordPressMigrationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <WordPressMigrator />
      </div>
    </div>
  );
}