import React, { useState } from 'react';
import { Download } from 'lucide-react';

interface ReportExportPanelProps {
  availableCategories: string[];
  onExport: (params: { startDate: string; endDate: string; category: string; format: 'html' | 'pdf'; type?: string }) => Promise<void>;
  defaultType?: string;
  typeOptions?: Array<{ value: string; label: string }>;
  initialMonth?: string;
}

export function ReportExportPanel({
  availableCategories,
  onExport,
  defaultType,
  typeOptions,
  initialMonth,
}: ReportExportPanelProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Parse initial month to get start and end dates
  const getInitialDates = () => {
    if (initialMonth) {
      const [year, month] = initialMonth.split('-');
      return {
        startDate: `${year}-${month}-01`,
        endDate: `${year}-${month}-31`
      };
    }
    return {
      startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      endDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`
    };
  };

  const [dateRangeType, setDateRangeType] = useState('month');
  const [reportStartDate, setReportStartDate] = useState(getInitialDates().startDate);
  const [reportEndDate, setReportEndDate] = useState(getInitialDates().endDate);
  const [selectedYear, setSelectedYear] = useState(`${currentYear}`);
  const [reportCategory, setReportCategory] = useState('all');
  const [reportFormat, setReportFormat] = useState<'html' | 'pdf'>('html');
  const [reportType, setReportType] = useState(defaultType ?? 'default');
  const [exportingReport, setExportingReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate year options
  const yearOptions = [];
  for (let i = currentYear - 5; i <= currentYear; i++) {
    yearOptions.push(i);
  }

  const handleDateRangeTypeChange = (newType: string) => {
    setDateRangeType(newType);
    
    if (newType === 'annual') {
      const startOfYear = `${selectedYear}-01-01`;
      const endOfYear = `${selectedYear}-12-31`;
      setReportStartDate(startOfYear);
      setReportEndDate(endOfYear);
    } else if (newType === 'month') {
      const [year, month] = reportStartDate.split('-').slice(0, 2);
      setReportStartDate(`${year}-${month}-01`);
      setReportEndDate(`${year}-${month}-31`);
    }
  };

  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);
    if (dateRangeType === 'annual') {
      setReportStartDate(`${newYear}-01-01`);
      setReportEndDate(`${newYear}-12-31`);
    }
  };

  const handleExport = async () => {
    setErrorMessage(null);
    setExportingReport(true);
    try {
      await onExport({
        startDate: reportStartDate,
        endDate: reportEndDate,
        category: reportCategory,
        format: reportFormat,
        type: reportType,
      });
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to export report.');
    } finally {
      setExportingReport(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Generate Report</h3>
          <p className="text-sm text-muted-foreground mt-1">Export a report for the selected duration, category, and format.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportingReport}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Download className="w-4 h-4" />
          {exportingReport ? 'Preparing report...' : 'Download Report'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Download Duration</label>
          <select
            value={dateRangeType}
            onChange={(e) => handleDateRangeTypeChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="month">Monthly</option>
            <option value="annual">Annual</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateRangeType === 'month' && (
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Month</label>
            <input
              type="month"
              value={`${reportStartDate.split('-').slice(0, 2).join('-')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                setReportStartDate(`${year}-${month}-01`);
                setReportEndDate(`${year}-${month}-31`);
              }}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
        )}

        {dateRangeType === 'annual' && (
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}

        {dateRangeType === 'custom' && (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Start Date</label>
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">End Date</label>
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
          <select
            value={reportCategory}
            onChange={(e) => setReportCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="all">All categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Format</label>
          <select
            value={reportFormat}
            onChange={(e) => setReportFormat(e.target.value as 'html' | 'pdf')}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="html">HTML document</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        {typeOptions ? (
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Report type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {errorMessage && <p className="mt-4 text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
