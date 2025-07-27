import { useState } from 'react';
import { List, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type JourneyStage, type MessageType } from '@shared/schema';
import { journeyStageData } from '@/lib/journey-data';

interface MessageTypeConfiguratorProps {
  journeyStages: JourneyStage[];
  messageTypes: MessageType[];
  onUpdateMessageType: (id: string, updates: Partial<MessageType>) => void;
  calculateCredits: (messageType: MessageType) => MessageType['credits'];
  expandedStages: Set<string>;
}

export function MessageTypeConfigurator({
  journeyStages,
  messageTypes,
  onUpdateMessageType,
  calculateCredits,
  expandedStages
}: MessageTypeConfiguratorProps) {
  // Filter to show only selected message types from expanded stages
  const visibleMessageTypes = messageTypes.filter(mt => 
    mt.selected && expandedStages.has(mt.journeyStageId)
  );

  if (visibleMessageTypes.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <List className="text-primary-500 h-5 w-5 mr-2" />
          Message Type Configuration
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">Select message types from journey stages to configure channels and audience sizes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <List className="text-primary-500 h-5 w-5 mr-2" />
        Message Type Configuration
      </h3>

      <div className="space-y-4">
        {visibleMessageTypes.map((messageType) => {
          const credits = calculateCredits(messageType);
          const stage = journeyStages.find(s => s.id === messageType.journeyStageId);
          
          return (
            <div key={messageType.id} className="border border-primary-200 rounded-lg p-3 bg-primary-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h5 className="font-medium text-gray-900">{messageType.type}</h5>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm text-gray-700">Frequency:</Label>
                    <Select
                      value={messageType.frequency}
                      onValueChange={(value: any) => onUpdateMessageType(messageType.id, { frequency: value })}
                    >
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Channel Configuration */}
                <div className="grid grid-cols-3 gap-2">
                  {/* SMS Channel */}
                  <div className="border border-gray-200 rounded-lg p-2 bg-white">
                    <Label className="block text-sm font-medium text-gray-900 mb-2">SMS</Label>
                    <div>
                      <Label className="block text-xs text-gray-600 mb-1">
                        Audience Size
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={messageType.channels.sms.audienceSize || ''}
                        onChange={(e) => onUpdateMessageType(messageType.id, {
                          channels: { 
                            ...messageType.channels, 
                            sms: { 
                              enabled: true,
                              audienceSize: parseInt(e.target.value) || 0 
                            }
                          }
                        })}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Email Channel */}
                  <div className="border border-gray-200 rounded-lg p-2 bg-white">
                    <Label className="block text-sm font-medium text-gray-900 mb-2">Email</Label>
                    <div>
                      <Label className="block text-xs text-gray-600 mb-1">
                        Audience Size
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={messageType.channels.email.audienceSize || ''}
                        onChange={(e) => onUpdateMessageType(messageType.id, {
                          channels: { 
                            ...messageType.channels, 
                            email: { 
                              enabled: true,
                              audienceSize: parseInt(e.target.value) || 0 
                            }
                          }
                        })}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Push Channel */}
                  <div className="border border-gray-200 rounded-lg p-2 bg-white">
                    <Label className="block text-sm font-medium text-gray-900 mb-2">Push</Label>
                    <div>
                      <Label className="block text-xs text-gray-600 mb-1">
                        Audience Size
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={messageType.channels.push.audienceSize || ''}
                        onChange={(e) => onUpdateMessageType(messageType.id, {
                          channels: { 
                            ...messageType.channels, 
                            push: { 
                              enabled: true,
                              audienceSize: parseInt(e.target.value) || 0 
                            }
                          }
                        })}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Credit Breakdown */}
                <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-300 bg-gray-50 px-3 py-2 rounded">
                  <div className="text-center">
                    <span className="text-gray-600">SMS: </span>
                    <span className="font-semibold text-gray-900">{Math.round(credits.sms).toLocaleString()}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-600">Email: </span>
                    <span className="font-semibold text-gray-900">{Math.round(credits.email).toLocaleString()}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-600">Push: </span>
                    <span className="font-semibold text-gray-900">{Math.round(credits.push).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}