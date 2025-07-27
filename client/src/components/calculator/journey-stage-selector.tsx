import { Route, ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { type JourneyStage, type MessageType } from '@shared/schema';
import { journeyStageData } from '@/lib/journey-data';

interface JourneyStageSelectorProps {
  journeyStages: JourneyStage[];
  messageTypes: MessageType[];
  onMessageTypeToggle: (messageTypeId: string) => void;
  expandedStages: Set<string>;
  onExpandedStagesChange: (expandedStages: Set<string>) => void;
}

export function JourneyStageSelector({ journeyStages, messageTypes, onMessageTypeToggle, expandedStages, onExpandedStagesChange }: JourneyStageSelectorProps) {

  const getStageMessageCount = (stageId: string) => {
    return messageTypes.filter(mt => mt.journeyStageId === stageId && mt.selected).length;
  };

  const toggleStageExpansion = (stageId: string) => {
    const newSet = new Set<string>();
    // If clicking the same stage that's already expanded, collapse it
    // Otherwise, expand only the clicked stage (collapsing all others)
    if (!expandedStages.has(stageId)) {
      newSet.add(stageId);
    }
    onExpandedStagesChange(newSet);
  };

  return (
    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Route className="text-primary-500 h-5 w-5 mr-2" />
        Journey Stage Selection
      </h2>
      
      <div className="space-y-3">
        {journeyStages.map((stage) => {
          const stageData = journeyStageData.find(s => s.id === stage.id);
          const stageMessageTypes = messageTypes.filter(mt => mt.journeyStageId === stage.id);
          const selectedCount = getStageMessageCount(stage.id);
          const isExpanded = expandedStages.has(stage.id);
          
          return (
            <div key={stage.id} className="border border-gray-200 rounded-lg bg-white">
              {/* Stage Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleStageExpansion(stage.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <h3 className="font-medium text-gray-900">{stage.name}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="bg-primary-100 text-primary-700">
                        {selectedCount} selected
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500">
                      {stageData?.messageTypes.length || 0} available
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Type Checkboxes */}
              {isExpanded && stageData && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stageMessageTypes.map((messageType) => (
                      <div key={messageType.id} className="flex items-center space-x-3 p-2 rounded bg-white">
                        <Checkbox
                          checked={messageType.selected}
                          onCheckedChange={() => onMessageTypeToggle(messageType.id)}
                          className="h-4 w-4"
                        />
                        <Label 
                          className="text-sm text-gray-900 flex-1 cursor-pointer"
                          onClick={() => onMessageTypeToggle(messageType.id)}
                        >
                          {messageType.type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}