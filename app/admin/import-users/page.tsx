'use client';

import { useState } from 'react';

export default function ImportUsersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [importType, setImportType] = useState<'general' | 'wordpress'>('general');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', importType);

    try {
      const response = await fetch('/api/admin/import-users', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        let message = `Successfully imported ${data.count} users`;
        if (data.skipped > 0) {
          message += `, skipped ${data.skipped} existing users`;
        }
        if (data.errors && data.errors.length > 0) {
          message += `, ${data.errors.length} errors`;
        }
        setResult(message);

        if (data.errors && data.errors.length > 0) {
          console.log('Import errors:', data.errors);
        }
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Import Users</h1>

      <div className="max-w-md space-y-4">
        {/* Import Type Selector */}
        <div>
          <label htmlFor="importType" className="block text-sm font-medium mb-2">
            Import Type
          </label>
          <select
            id="importType"
            value={importType}
            onChange={(e) => setImportType(e.target.value as 'general' | 'wordpress')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="general">General Users</option>
            <option value="wordpress">WordPress Users</option>
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-2">
            Select CSV file
          </label>
          <input
            type="file"
            id="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? 'Importing...' : 'Import Users'}
        </button>

        {/* Result */}
        {result && (
          <div className={`p-4 rounded ${result.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {result}
          </div>
        )}
      </div>

      {/* CSV Format Instructions */}
      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-medium mb-2">Expected CSV format:</h3>

        {importType === 'general' ? (
          <>
            <code className="block bg-gray-100 p-2 rounded mb-2">
              email,password,fullNameArabic,fullNameEnglish,role,username,emailVerified,isActive
            </code>
            <div className="space-y-1 text-xs">
              <p><strong>Required:</strong> email, password, fullNameArabic, fullNameEnglish</p>
              <p><strong>Optional:</strong> role (USER/EDITOR/AUTHOR/ADMIN), username, emailVerified (true/false), isActive (true/false)</p>
              <p><strong>Example:</strong> user@example.com,password123,محمد أحمد,MOHAMMED AHMED,USER,mohammed,true,true</p>
            </div>
          </>
        ) : (
          <>
            <code className="block bg-gray-100 p-2 rounded mb-2">
              ID,user_login,user_email,user_registered,display_name
            </code>
            <div className="space-y-1 text-xs">
              <p><strong>All fields required for WordPress import</strong></p>
              <p><strong>user_registered:</strong> Format: YYYY-MM-DD HH:MM:SS or MM/DD/YYYY HH:MM</p>
              <p><strong>Note:</strong> All users get default password &quot;123&quot; and must change it after first login</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}