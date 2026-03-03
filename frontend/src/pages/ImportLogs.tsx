import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Building2,
  Users,
  UserCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import client, { ImportLog, ImportLogEntry } from '@/lib/api';
import Layout from '@/components/Layout';

export default function ImportLogs() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailLog, setDetailLog] = useState<ImportLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { limit: 50 };
      if (entityFilter !== 'all') params.entityType = entityFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await client.import.getLogs(params);
      if (response.data) {
        setLogs(response.data.items);
      }
    } catch {
      toast.error('Failed to load import logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, statusFilter]);

  const openDetail = async (log: ImportLog) => {
    setDetailLoading(true);
    setDetailLog(log);
    try {
      const response = await client.import.getLogById(log.id);
      if (response.data) {
        setDetailLog(response.data);
      }
    } catch {
      toast.error('Failed to load log details');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleEntryExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'company':
        return <Building2 className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'employee':
        return <UserCircle className="h-4 w-4" />;
      default:
        return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEntryStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'skipped':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"><AlertCircle className="h-3 w-3 mr-1" />Skipped</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    return (
      log.fileName.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Import Logs</h1>
            <p className="text-gray-400 mt-1">View history of all CSV imports</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-[#0f1419] border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by filename or user..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-[#1a2332] border-gray-700"
                  />
                </div>
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[150px] bg-[#1a2332] border-gray-700">
                  <SelectValue placeholder="Entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="company">Companies</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="employee">Employees</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-[#1a2332] border-gray-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="bg-[#0f1419] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-400" />
              Import History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No import logs found</p>
              </div>
            ) : (
              <div className="border border-gray-800 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#1a2332] hover:bg-[#1a2332]">
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">File</TableHead>
                      <TableHead className="text-gray-400">User</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400 text-center">Total</TableHead>
                      <TableHead className="text-gray-400 text-center">Success</TableHead>
                      <TableHead className="text-gray-400 text-center">Errors</TableHead>
                      <TableHead className="text-gray-400 w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-[#1a2332]/50">
                        <TableCell className="text-gray-300 text-sm">
                          {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-300">
                            {getEntityIcon(log.entityType)}
                            <span className="capitalize">{log.entityType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm max-w-[150px] truncate">
                          {log.fileName}
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {log.user?.name || log.user?.email || '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className="text-center text-gray-300">{log.totalRows}</TableCell>
                        <TableCell className="text-center text-emerald-400">{log.successCount}</TableCell>
                        <TableCell className="text-center text-red-400">{log.errorCount}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(log)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailLog} onOpenChange={() => setDetailLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#0f1419] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-400" />
              Import Details
            </DialogTitle>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : detailLog && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#1a2332] rounded-lg p-4 border border-gray-800 text-center">
                  <div className="text-xl font-bold text-white">{detailLog.totalRows}</div>
                  <div className="text-sm text-gray-400">Total Rows</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30 text-center">
                  <div className="text-xl font-bold text-emerald-400">{detailLog.successCount}</div>
                  <div className="text-sm text-emerald-400/70">Created</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30 text-center">
                  <div className="text-xl font-bold text-yellow-400">{detailLog.skipCount}</div>
                  <div className="text-sm text-yellow-400/70">Skipped</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30 text-center">
                  <div className="text-xl font-bold text-red-400">{detailLog.errorCount}</div>
                  <div className="text-sm text-red-400/70">Errors</div>
                </div>
              </div>

              {/* Entries */}
              {detailLog.entries && detailLog.entries.length > 0 && (
                <div className="border border-gray-800 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#1a2332] hover:bg-[#1a2332]">
                        <TableHead className="text-gray-400 w-16">Row</TableHead>
                        <TableHead className="text-gray-400 w-28">Status</TableHead>
                        <TableHead className="text-gray-400">Details</TableHead>
                        <TableHead className="text-gray-400 w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailLog.entries.map((entry: ImportLogEntry) => (
                        <>
                          <TableRow key={entry.id} className="hover:bg-[#1a2332]/50">
                            <TableCell className="text-gray-300">{entry.rowNumber}</TableCell>
                            <TableCell>{getEntryStatusBadge(entry.status)}</TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              {entry.status === 'success' && entry.entityId && (
                                <span className="text-emerald-400">Created ID: {entry.entityId.slice(0, 8)}...</span>
                              )}
                              {entry.errorMessage && (
                                <span className="text-red-400">{entry.errorMessage}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {entry.rawData && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleEntryExpansion(entry.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  {expandedEntries.has(entry.id) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedEntries.has(entry.id) && entry.rawData && (
                            <TableRow key={`${entry.id}-expanded`} className="bg-[#0a0f14]">
                              <TableCell colSpan={4} className="py-3">
                                <pre className="text-xs text-gray-400 bg-[#1a2332] p-3 rounded overflow-x-auto">
                                  {JSON.stringify(entry.rawData, null, 2)}
                                </pre>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
