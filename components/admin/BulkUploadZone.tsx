'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileUp, UploadCloud, CheckCircle2, Loader2, AlertCircle, Info } from 'lucide-react';

// Define the interface for props coming from the Dashboard
interface BulkUploadProps {
  jobCategory: 'AC' | 'HWS' | 'Solar';
}

export default function BulkUploadZone({ jobCategory }: BulkUploadProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus('idle');
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert Excel to JSON
        const jsonData = XLSX.utils.sheet_to_json(ws);

        // Send data to API with the selected Categories from Tabs
        const response = await fetch('/api/upload-excel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            data: jsonData,
            job_category: jobCategory,   // From Tabs
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload data');
        }

        setStatus('success');
        alert(`Successfully imported ${jsonData.length} jobs for ${jobCategory} `);
      } catch (err: any) {
        console.error("Upload Error:", err);
        setStatus('error');
        alert(`Upload Failed: ${err.message}`);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileUp className="text-blue-600" size={20} />
          <h3 className="font-bold text-slate-800">Bulk Import</h3>
        </div>
        <div className="flex items-center gap-2">
           {status === 'success' && <CheckCircle2 className="text-green-500" size={18} />}
           {status === 'error' && <AlertCircle className="text-red-500" size={18} />}
        </div>
      </div>
      
      <label className={`flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-xl cursor-pointer transition
        ${loading ? 'bg-slate-50 border-blue-300' : 'bg-white border-slate-300 hover:bg-slate-50 hover:border-blue-400'}
      `}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          {loading ? (
            <>
              <Loader2 className="animate-spin text-blue-600 mb-3" size={40} />
              <p className="text-sm font-semibold text-slate-700">Processing {jobCategory} Upload...</p>
            </>
          ) : (
            <>
              <UploadCloud className="text-slate-400 mb-3" size={40} />
              <p className="text-sm text-slate-600 font-medium">Click to upload <span className="text-blue-600 font-bold">{jobCategory}</span> Excel</p>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed max-w-[200px]">
                File will be tagged as <b>{jobCategory}</b>
              </p>
            </>
          )}
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleExcelUpload} 
          disabled={loading} 
        />
      </label>

      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-slate-400 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Names in the Excel will be automatically matched against <b>Profile Aliases</b>. 
            Ensure columns match the template for {jobCategory} projects.
          </p>
        </div>
      </div>
    </div>
  );
}