import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ShoppingCart,
  User,
  Glasses,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  History,
  ArrowRight,
  Loader2,
  Building2,
  AlertTriangle,
  Eye,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import client, { Order, StatusHistoryEntry, AvailableTransition, PrescriptionInput } from '@/lib/api';

interface OrderDetailDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: () => void;
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  pending: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
  approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  in_production: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Package },
  shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Truck },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
};

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function OrderDetailDialog({
  orderId,
  open,
  onOpenChange,
  onOrderUpdated,
}: OrderDetailDialogProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [availableTransitions, setAvailableTransitions] = useState<AvailableTransition[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionNote, setTransitionNote] = useState('');
  const [selectedTransition, setSelectedTransition] = useState<string | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionInput>({});
  const [savingPrescription, setSavingPrescription] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      loadOrder();
    } else {
      setOrder(null);
      setStatusHistory([]);
      setAvailableTransitions([]);
    }
  }, [open, orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const [orderRes, historyRes, transitionsRes, prescriptionRes] = await Promise.all([
        client.orders.getById(orderId),
        client.orders.getStatusHistory(orderId),
        client.orders.getTransitions(orderId),
        client.prescriptions.get(orderId),
      ]);

      if (orderRes.data) {
        setOrder(orderRes.data);
      }
      if (historyRes.data) {
        setStatusHistory(historyRes.data);
      }
      if (transitionsRes.data) {
        setAvailableTransitions(transitionsRes.data.availableTransitions);
      }
      if (prescriptionRes.data) {
        const rx = prescriptionRes.data;
        setPrescriptionForm({
          odSphere: rx.odSphere,
          odCylinder: rx.odCylinder,
          odAxis: rx.odAxis,
          odAddition: rx.odAddition,
          osSphere: rx.osSphere,
          osCylinder: rx.osCylinder,
          osAxis: rx.osAxis,
          osAddition: rx.osAddition,
          pdRight: rx.pdRight,
          pdLeft: rx.pdLeft,
          pdBinocular: rx.pdBinocular,
          notes: rx.notes,
        });
      } else {
        setPrescriptionForm({});
      }
    } catch {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async (newStatus: string, requiresNote: boolean) => {
    if (requiresNote && !transitionNote.trim()) {
      setSelectedTransition(newStatus);
      return;
    }

    if (!orderId) return;

    setTransitioning(true);
    try {
      const result = await client.orders.transitionStatus(orderId, newStatus, transitionNote || undefined);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Status changed to ${formatStatus(newStatus)}`);
        setTransitionNote('');
        setSelectedTransition(null);
        loadOrder();
        onOrderUpdated?.();
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTransitioning(false);
    }
  };

  const handlePrescriptionSave = async () => {
    if (!orderId) return;
    setSavingPrescription(true);
    try {
      const result = await client.prescriptions.upsert(orderId, prescriptionForm);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Prescription saved successfully');
        if (result.data) {
          setPrescriptionForm({
            odSphere: result.data.odSphere,
            odCylinder: result.data.odCylinder,
            odAxis: result.data.odAxis,
            odAddition: result.data.odAddition,
            osSphere: result.data.osSphere,
            osCylinder: result.data.osCylinder,
            osAxis: result.data.osAxis,
            osAddition: result.data.osAddition,
            pdRight: result.data.pdRight,
            pdLeft: result.data.pdLeft,
            pdBinocular: result.data.pdBinocular,
            notes: result.data.notes,
          });
        }
      }
    } catch {
      toast.error('Failed to save prescription');
    } finally {
      setSavingPrescription(false);
    }
  };

  const updatePrescriptionField = (field: Exclude<keyof PrescriptionInput, 'notes'>, value: string) => {
    const numValue = value === '' ? null : (() => {
      const n = parseFloat(value);
      return Number.isNaN(n) ? null : n;
    })();
    setPrescriptionForm((prev) => ({ ...prev, [field]: numValue }));
  };

  const status = statusConfig[order?.status || 'draft'] || statusConfig.draft;
  const StatusIcon = status.icon;

  const hasItems = order?.items && order.items.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl border-0 shadow-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <span>Order {order?.orderNumber || `#${order?.id?.slice(0, 8) || ''}`}</span>
              {order && (
                <Badge className={`ml-3 ${status.bg} ${status.text} border-0 text-xs`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {formatStatus(order.status)}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : order ? (
          <Tabs defaultValue="details" className="flex-1 flex flex-col">
            <TabsList className="mx-6 mt-4 bg-gray-100">
              <TabsTrigger value="details">Details</TabsTrigger>
              {hasItems && <TabsTrigger value="items">Items ({order.items?.length})</TabsTrigger>}
              <TabsTrigger value="prescription">
                <Eye className="h-3 w-3 mr-1" />
                Rx
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-6 py-4">
              <TabsContent value="details" className="mt-0 space-y-4">
                {/* Employee Info */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">Employee</span>
                  </div>
                  <div className="ml-11 space-y-1">
                    <p className="font-semibold text-gray-900">{order.employee?.name || 'Unknown'}</p>
                    {order.employee?.department && (
                      <p className="text-sm text-gray-500">Department: {order.employee.department}</p>
                    )}
                    {order.employee?.registration && (
                      <p className="text-sm text-gray-500">Registration: {order.employee.registration}</p>
                    )}
                  </div>
                </div>

                {/* Company Info */}
                {order.employee?.company && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="font-medium text-gray-900">Company</span>
                    </div>
                    <div className="ml-11">
                      <p className="font-semibold text-gray-900">{order.employee.company.corporateName}</p>
                      {order.employee.company.cnpj && (
                        <p className="text-sm text-gray-500 font-mono">{order.employee.company.cnpj}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Legacy Single Frame */}
                {order.frame && !hasItems && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Glasses className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-900">Frame</span>
                    </div>
                    <div className="ml-11 flex items-center gap-4">
                      {order.frame.image1Url && (
                        <img
                          src={client.storage.getFullUrl(order.frame.image1Url)}
                          alt={order.frame.modelName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{order.frame.modelName}</p>
                        <p className="text-sm text-gray-500">
                          {[order.frame.color, order.frame.size].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Notes</p>
                    <p className="text-sm text-yellow-700">{order.notes}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(order.updatedAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {hasItems && (
                <TabsContent value="items" className="mt-0 space-y-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      {item.frame.image1Url ? (
                        <img
                          src={client.storage.getFullUrl(item.frame.image1Url)}
                          alt={item.frame.modelName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Glasses className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.frame.modelName}</p>
                        <p className="text-sm text-gray-500">
                          {[item.color || item.frame.color, item.size || item.frame.size].filter(Boolean).join(' • ')}
                        </p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      {item.price && (
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">R$ {item.price.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>
              )}

              <TabsContent value="prescription" className="mt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold text-gray-900">Optical Prescription</h3>
                    </div>
                    <Button
                      size="sm"
                      onClick={handlePrescriptionSave}
                      disabled={savingPrescription}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {savingPrescription ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save Rx
                    </Button>
                  </div>

                  {/* OD - Right Eye */}
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-medium text-blue-900 mb-3">OD - Right Eye (Olho Direito)</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs text-blue-700">Sphere (Esf)</Label>
                        <Input
                          type="number"
                          step="0.25"
                          placeholder="-20 to +20"
                          value={prescriptionForm.odSphere ?? ''}
                          onChange={(e) => updatePrescriptionField('odSphere', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-blue-700">Cylinder (Cil)</Label>
                        <Input
                          type="number"
                          step="0.25"
                          placeholder="-10 to +10"
                          value={prescriptionForm.odCylinder ?? ''}
                          onChange={(e) => updatePrescriptionField('odCylinder', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-blue-700">Axis (Eixo)</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="0-180°"
                          value={prescriptionForm.odAxis ?? ''}
                          onChange={(e) => updatePrescriptionField('odAxis', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-blue-700">Addition (Add)</Label>
                        <Input
                          type="number"
                          step="0.25"
                          placeholder="0 to +4"
                          value={prescriptionForm.odAddition ?? ''}
                          onChange={(e) => updatePrescriptionField('odAddition', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OS - Left Eye */}
                  <div className="p-4 bg-green-50 rounded-xl">
                    <h4 className="font-medium text-green-900 mb-3">OS - Left Eye (Olho Esquerdo)</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs text-green-700">Sphere (Esf)</Label>
                        <Input
                          type="number"
                          step="0.25"
                          placeholder="-20 to +20"
                          value={prescriptionForm.osSphere ?? ''}
                          onChange={(e) => updatePrescriptionField('osSphere', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-green-700">Cylinder (Cil)</Label>
                        <Input
                          type="number"
                          step="0.25"
                          placeholder="-10 to +10"
                          value={prescriptionForm.osCylinder ?? ''}
                          onChange={(e) => updatePrescriptionField('osCylinder', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-green-700">Axis (Eixo)</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="0-180°"
                          value={prescriptionForm.osAxis ?? ''}
                          onChange={(e) => updatePrescriptionField('osAxis', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-green-700">Addition (Add)</Label>
                        <Input
                          type="number"
                          step="0.25"
                          placeholder="0 to +4"
                          value={prescriptionForm.osAddition ?? ''}
                          onChange={(e) => updatePrescriptionField('osAddition', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PD - Pupillary Distance */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-3">PD - Pupillary Distance (DNP)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600">Right PD (mm)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="20-80"
                          value={prescriptionForm.pdRight ?? ''}
                          onChange={(e) => updatePrescriptionField('pdRight', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Left PD (mm)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="20-80"
                          value={prescriptionForm.pdLeft ?? ''}
                          onChange={(e) => updatePrescriptionField('pdLeft', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Binocular PD (mm)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="40-80"
                          value={prescriptionForm.pdBinocular ?? ''}
                          onChange={(e) => updatePrescriptionField('pdBinocular', e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-xs text-gray-600">Prescription Notes</Label>
                    <Textarea
                      placeholder="Additional notes about the prescription..."
                      value={prescriptionForm.notes ?? ''}
                      onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, notes: e.target.value || null }))}
                      className="mt-2 min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Prescription Image Link */}
                  {order.prescriptionUrl && (
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-900">Prescription Image</span>
                        </div>
                        <a
                          href={client.storage.getFullUrl(order.prescriptionUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-orange-600 hover:text-orange-700 underline"
                        >
                          View Uploaded Prescription
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                {statusHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No status history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {statusHistory.map((entry, index) => (
                      <div key={entry.id} className="relative pl-8">
                        {index < statusHistory.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />
                        )}
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <ArrowRight className="h-3 w-3 text-gray-500" />
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${statusConfig[entry.fromStatus]?.bg || 'bg-gray-100'} ${statusConfig[entry.fromStatus]?.text || 'text-gray-700'} border-0 text-xs`}>
                              {formatStatus(entry.fromStatus)}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <Badge className={`${statusConfig[entry.toStatus]?.bg || 'bg-gray-100'} ${statusConfig[entry.toStatus]?.text || 'text-gray-700'} border-0 text-xs`}>
                              {formatStatus(entry.toStatus)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {entry.user?.name || 'System'} • {format(new Date(entry.createdAt), 'MMM d, yyyy HH:mm')}
                          </p>
                          {entry.note && (
                            <p className="text-sm text-gray-700 mt-2 italic">"{entry.note}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actions" className="mt-0 space-y-4">
                {availableTransitions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No available status transitions</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Available status transitions:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {availableTransitions.map((transition) => {
                        const transitionStatus = statusConfig[transition.status] || statusConfig.draft;
                        const TransitionIcon = transitionStatus.icon;
                        return (
                          <Button
                            key={transition.status}
                            variant="outline"
                            className={`justify-start gap-2 h-auto py-3 ${
                              transition.status === 'cancelled' ? 'border-red-200 hover:bg-red-50' : ''
                            }`}
                            onClick={() => handleTransition(transition.status, transition.requiresNote)}
                            disabled={transitioning}
                          >
                            <TransitionIcon className={`h-4 w-4 ${transitionStatus.text}`} />
                            <div className="text-left">
                              <p className="font-medium">{formatStatus(transition.status)}</p>
                              {transition.requiresNote && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Requires note
                                </p>
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </div>

                    {selectedTransition && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
                        <Label className="text-sm font-medium text-yellow-800">
                          Note required for transitioning to {formatStatus(selectedTransition)}
                        </Label>
                        <Textarea
                          placeholder="Enter a reason for this status change..."
                          value={transitionNote}
                          onChange={(e) => setTransitionNote(e.target.value)}
                          className="bg-white"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTransition(null);
                              setTransitionNote('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleTransition(selectedTransition, false)}
                            disabled={!transitionNote.trim() || transitioning}
                          >
                            {transitioning ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              'Confirm'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <div className="py-16 text-center text-gray-500">Order not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
