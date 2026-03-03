import { useState, useCallback, useRef, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Users,
  UserCircle,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import client, { ImportLogEntry, ImportResult } from '@/lib/api';
import Layout from '@/components/Layout';

type EntityType = 'company' | 'user' | 'employee';

const entityConfig: Record<EntityType, { label: string; icon: React.ReactNode; description: string }> = {
  company: {
    label: 'Companies',
    icon: <Building2 className="h-5 w-5" />,
    description: 'Import companies with CNPJ, corporate name, email, and phone',
  },
  user: {
    label: 'Users',
    icon: <Users className="h-5 w-5" />,
    description: 'Import users with email, name, role, and optional company link',
  },
  employee: {
    label: 'Employees',
    icon: <UserCircle className="h-5 w-5" />,
    description: 'Import employees with name, company CNPJ, department, and registration',
  },
};

export default function Import() {
  const [activeTab, setActiveTab] = useState<EntityType>('company');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [activeTab]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      let response;
      switch (activeTab) {
        case 'company':
          response = await client.import.importCompanies(file);
          break;
        case 'user':
          response = await client.import.importUsers(file);
          break;
        case 'employee':
          response = await client.import.importEmployees(file);
          break;
      }

      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (response.data) {
        setResult(response.data);
        const { success, errors, skipped } = response.data.summary;
        if (errors === 0) {
          toast.success(`Import completed: ${success} records created, ${skipped} skipped`);
        } else {
          toast.warning(`Import completed with errors: ${success} created, ${errors} errors, ${skipped} skipped`);
        }
      }
    } catch {
      toast.error('Import failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = (entityType: EntityType) => {
    const url = client.import.getTemplateUrl(entityType);
    const token = client.auth.getToken();
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityType}_template.csv`;
    
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => toast.error('Failed to download template'));
  };

  const toggleRowExpansion = (rowNumber: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowNumber)) {
      newExpanded.delete(rowNumber);
    } else {
      newExpanded.add(rowNumber);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'skipped':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><AlertCircle className="h-3 w-3 mr-1" />Skipped</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const entries = result?.importLog?.entries || [];
  const errorEntries = entries.filter((e: ImportLogEntry) => e.status === 'error' || e.status === 'skipped');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">CSV Import</h1>
            <p className="text-gray-400 mt-1">Import data from CSV files into the system</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as EntityType); setResult(null); }}>
          <TabsList className="bg-[#1a2332] border border-gray-800">
            {Object.entries(entityConfig).map(([key, config]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <span className="flex items-center gap-2">
                  {config.icon}
                  {config.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(entityConfig).map(([key, config]) => (
            <TabsContent key={key} value={key} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Card */}
                <Card className="bg-[#0f1419] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Upload className="h-5 w-5 text-blue-400" />
                      Upload {config.label}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                          <p className="text-gray-400">Processing import...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <FileSpreadsheet className="h-10 w-10 text-gray-500" />
                          <div>
                            <p className="text-gray-300">Drag and drop a CSV file here</p>
                            <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Template Card */}
                <Card className="bg-[#0f1419] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-400" />
                      CSV Template
                    </CardTitle>
                    <CardDescription>Download a template with the correct format</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-[#1a2332] rounded-lg p-4 border border-gray-800">
                      <h4 className="text-sm font-medium text-white mb-2">Required columns:</h4>
                      <ul className="text-sm text-gray-400 space-y-1">
                        {key === 'company' && (
                          <>
                            <li>• <code className="text-blue-400">cnpj</code> - Company CNPJ (XX.XXX.XXX/XXXX-XX)</li>
                            <li>• <code className="text-blue-400">corporateName</code> - Company name</li>
                            <li>• <code className="text-gray-500">email</code> - Contact email (optional)</li>
                            <li>• <code className="text-gray-500">phone</code> - Phone number (optional)</li>
                            <li>• <code className="text-gray-500">status</code> - active/inactive (optional)</li>
                          </>
                        )}
                        {key === 'user' && (
                          <>
                            <li>• <code className="text-blue-400">email</code> - User email</li>
                            <li>• <code className="text-blue-400">name</code> - User name</li>
                            <li>• <code className="text-gray-500">role</code> - ADMIN/COMPANY_MANAGER/USER (optional)</li>
                            <li>• <code className="text-gray-500">companyCnpj</code> - Link to company (optional)</li>
                            <li>• <code className="text-gray-500">password</code> - Initial password (optional)</li>
                          </>
                        )}
                        {key === 'employee' && (
                          <>
                            <li>• <code className="text-blue-400">name</code> - Employee name</li>
                            <li>• <code className="text-blue-400">companyCnpj</code> - Company CNPJ</li>
                            <li>• <code className="text-gray-500">department</code> - Department (optional)</li>
                            <li>• <code className="text-gray-500">registration</code> - Employee ID (optional)</li>
                            <li>• <code className="text-gray-500">shift</code> - Work shift (optional)</li>
                            <li>• <code className="text-gray-500">unit</code> - Work unit (optional)</li>
                          </>
                        )}
                      </ul>
                    </div>
                    <Button
                      onClick={() => downloadTemplate(key as EntityType)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Results */}
              {result && (
                <Card className="bg-[#0f1419] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Import Results</CardTitle>
                    <CardDescription>
                      {result.summary.total} rows processed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-[#1a2332] rounded-lg p-4 border border-gray-800 text-center">
                        <div className="text-2xl font-bold text-white">{result.summary.total}</div>
                        <div className="text-sm text-gray-400">Total Rows</div>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30 text-center">
                        <div className="text-2xl font-bold text-emerald-400">{result.summary.success}</div>
                        <div className="text-sm text-emerald-400/70">Created</div>
                      </div>
                      <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{result.summary.skipped}</div>
                        <div className="text-sm text-yellow-400/70">Skipped</div>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30 text-center">
                        <div className="text-2xl font-bold text-red-400">{result.summary.errors}</div>
                        <div className="text-sm text-red-400/70">Errors</div>
                      </div>
                    </div>

                    {/* Error/Skip Details */}
                    {errorEntries.length > 0 && (
                      <div className="border border-gray-800 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-[#1a2332] hover:bg-[#1a2332]">
                              <TableHead className="text-gray-400 w-16">Row</TableHead>
                              <TableHead className="text-gray-400 w-28">Status</TableHead>
                              <TableHead className="text-gray-400">Message</TableHead>
                              <TableHead className="text-gray-400 w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {errorEntries.map((entry: ImportLogEntry) => (
                              <Fragment key={entry.id}>
                                <TableRow className="hover:bg-[#1a2332]/50">
                                  <TableCell className="text-gray-300">{entry.rowNumber}</TableCell>
                                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                                  <TableCell className="text-gray-400 text-sm">{entry.errorMessage}</TableCell>
                                  <TableCell>
                                    {entry.rawData && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleRowExpansion(entry.rowNumber)}
                                        className="h-8 w-8 p-0"
                                      >
                                        {expandedRows.has(entry.rowNumber) ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                                {expandedRows.has(entry.rowNumber) && entry.rawData && (
                                  <TableRow className="bg-[#0a0f14]">
                                    <TableCell colSpan={4} className="py-3">
                                      <pre className="text-xs text-gray-400 bg-[#1a2332] p-3 rounded overflow-x-auto">
                                        {JSON.stringify(entry.rawData, null, 2)}
                                      </pre>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
