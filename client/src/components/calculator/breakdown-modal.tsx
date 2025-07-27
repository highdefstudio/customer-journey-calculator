import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type JourneyStage, type MessageType } from '@shared/schema';
import { journeyStageData } from '@/lib/journey-data';

interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyStages: JourneyStage[];
  messageTypes: MessageType[];
  calculateCredits: (messageType: MessageType) => MessageType['credits'];
  totals: {
    sms: number;
    email: number;
    push: number;
    grand: number;
  };
}

export function BreakdownModal({
  isOpen,
  onClose,
  journeyStages,
  messageTypes,
  calculateCredits,
  totals
}: BreakdownModalProps) {
  const selectedStages = journeyStages.filter(stage => stage.selected);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Detailed Credit Breakdown
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] space-y-6">
          {selectedStages.map((stage) => {
            const stageMessageTypes = messageTypes.filter(mt => mt.journeyStageId === stage.id && mt.selected);
            
            if (stageMessageTypes.length === 0) return null;

            const stageTotal = stageMessageTypes.reduce((acc, mt) => {
              const credits = calculateCredits(mt);
              return acc + credits.sms + credits.email + credits.push;
            }, 0);

            return (
              <div key={stage.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">{stage.name}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Message Type</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">Audience</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">Frequency</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">SMS Credits/Month</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">Email Credits/Month</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">Push Credits/Month</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stageMessageTypes.map((messageType) => {
                        const credits = calculateCredits(messageType);
                        const messageTotal = credits.sms + credits.email + credits.push;

                        return (
                          <tr key={messageType.id}>
                            <td className="px-4 py-2 text-gray-900">{messageType.type}</td>
                            <td className="px-4 py-2 text-right text-gray-700">
                              SMS: {messageType.channels.sms.enabled ? messageType.channels.sms.audienceSize.toLocaleString() : 'N/A'}<br/>
                              Email: {messageType.channels.email.enabled ? messageType.channels.email.audienceSize.toLocaleString() : 'N/A'}<br/>
                              Push: {messageType.channels.push.enabled ? messageType.channels.push.audienceSize.toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-700 capitalize">
                              {messageType.frequency.replace('-', ' ')}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 font-medium">
                              {Math.round(credits.sms).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 font-medium">
                              {Math.round(credits.email).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 font-medium">
                              {Math.round(credits.push).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 font-semibold">
                              {Math.round(messageTotal).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={6} className="px-4 py-2 text-right font-medium text-gray-900">
                          Stage Total:
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-primary-600">
                          {Math.round(stageTotal).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total monthly credits across all stages and message types
            </div>
            <div className="text-xl font-bold text-primary-600">
              {Math.round(totals.grand).toLocaleString()} credits/month
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
