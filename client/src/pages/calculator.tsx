import { useState } from 'react';
import { Calculator as CalculatorIcon, Download, HelpCircle, ChevronDown, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfigurationPanel } from '@/components/calculator/configuration-panel';
import { JourneyStageSelector } from '@/components/calculator/journey-stage-selector';
import { MessageTypeConfigurator } from '@/components/calculator/message-type-configurator';
import { BreakdownModal } from '@/components/calculator/breakdown-modal';
import { type CreditRates, type JourneyStage, type MessageType } from '@shared/schema';
import { journeyStageData } from '@/lib/journey-data';
import { useToast } from '@/hooks/use-toast';

export default function Calculator() {
  const { toast } = useToast();
  
  const [creditRates, setCreditRates] = useState<CreditRates>({
    sms: 1.00,
    email: 0.10,
    push: 0.05
  });

  const [journeyStages, setJourneyStages] = useState<JourneyStage[]>(
    journeyStageData.map(stage => ({
      id: stage.id,
      name: stage.name,
      selected: false
    }))
  );

  // Initialize all message types for all stages so dropdowns are populated
  const [messageTypes, setMessageTypes] = useState<MessageType[]>(() => {
    const allMessageTypes: MessageType[] = [];
    journeyStageData.forEach(stage => {
      const stageMessageTypes = stage.messageTypes.map(messageType => ({
        id: `${stage.id}-${messageType.replace(/[^a-zA-Z0-9]/g, '-')}`,
        journeyStageId: stage.id,
        type: messageType,
        frequency: 'monthly' as const,
        selected: false,
        channels: { 
          sms: { enabled: false, audienceSize: 0 },
          email: { enabled: false, audienceSize: 0 },
          push: { enabled: false, audienceSize: 0 }
        },
        credits: { sms: 0, email: 0, push: 0 }
      }));
      allMessageTypes.push(...stageMessageTypes);
    });
    return allMessageTypes;
  });
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [channelFilters, setChannelFilters] = useState({
    sms: true,
    email: true,
    push: true
  });

  const calculateCredits = (messageType: MessageType): MessageType['credits'] => {
    // Calculate monthly multipliers for billing
    const monthlyMultiplier = {
      'daily': 30.44, // Average days per month (365/12)
      'weekly': 4.33, // Average weeks per month (52/12)
      'bi-weekly': 2.17, // Bi-weekly: every 2 weeks (26/12)
      'monthly': 1,
      'quarterly': 1 / 3 // Quarterly divided over 3 months
    }[messageType.frequency];

    return {
      sms: (messageType.channels.sms.audienceSize > 0 && channelFilters.sms) ? Math.round(messageType.channels.sms.audienceSize * creditRates.sms * monthlyMultiplier) : 0,
      email: (messageType.channels.email.audienceSize > 0 && channelFilters.email) ? Math.round(messageType.channels.email.audienceSize * creditRates.email * monthlyMultiplier) : 0,
      push: (messageType.channels.push.audienceSize > 0 && channelFilters.push) ? Math.round(messageType.channels.push.audienceSize * creditRates.push * monthlyMultiplier) : 0,
    };
  };

  const getTotalCredits = () => {
    const totals = messageTypes
      .filter(messageType => messageType.selected)
      .reduce(
        (acc, messageType) => {
          const credits = calculateCredits(messageType);
          return {
            sms: acc.sms + credits.sms,
            email: acc.email + credits.email,
            push: acc.push + credits.push,
          };
        },
        { sms: 0, email: 0, push: 0 }
      );

    return {
      ...totals,
      grand: totals.sms + totals.email + totals.push
    };
  };

  // Stages no longer need to be toggled - they just expand to show message types

  const handleMessageTypeToggle = (messageTypeId: string) => {
    setMessageTypes(prev => 
      prev.map(mt => 
        mt.id === messageTypeId 
          ? { ...mt, selected: !mt.selected }
          : mt
      )
    );
  };

  // No longer needed - message types are auto-generated from journey stages

  const handleUpdateMessageType = (id: string, updates: Partial<MessageType>) => {
    setMessageTypes(prev => 
      prev.map(mt => 
        mt.id === id 
          ? { ...mt, ...updates, credits: calculateCredits({ ...mt, ...updates }) }
          : mt
      )
    );
  };

  // Message types are now managed through journey stage selection

  const handleExport = () => {
    const totals = getTotalCredits();
    const selectedStages = journeyStages.filter(stage => stage.selected);
    
    // Create CSV content
    const csvRows = [];
    
    // Header information
    csvRows.push(['Credit Calculator Export']);
    csvRows.push(['Generated:', new Date().toLocaleString()]);
    csvRows.push(['']);
    
    // Credit rates
    csvRows.push(['Credit Rates']);
    csvRows.push(['Channel', 'Credits per Message']);
    csvRows.push(['SMS', creditRates.sms]);
    csvRows.push(['Email', creditRates.email]);
    csvRows.push(['Push', creditRates.push]);
    csvRows.push(['']);
    
    // Monthly totals summary
    csvRows.push(['Monthly Credit Totals Summary']);
    csvRows.push(['Channel', 'Monthly Credits']);
    csvRows.push(['SMS', Math.round(totals.sms)]);
    csvRows.push(['Email', Math.round(totals.email)]);
    csvRows.push(['Push', Math.round(totals.push)]);
    csvRows.push(['Total Monthly Credits', Math.round(totals.grand)]);
    csvRows.push(['']);
    
    // Detailed breakdown by stage
    csvRows.push(['Detailed Breakdown by Journey Stage']);
    csvRows.push(['']);
    
    selectedStages.forEach((stage) => {
      const stageMessageTypes = messageTypes.filter(mt => mt.journeyStageId === stage.id && mt.selected);
      
      if (stageMessageTypes.length > 0) {
        csvRows.push([stage.name]);
        csvRows.push(['Message Type', 'Frequency', 'SMS Audience', 'Email Audience', 'Push Audience', 
                     'SMS Credits/Month', 'Email Credits/Month', 'Push Credits/Month', 'Total Monthly Credits']);
        
        let stageTotal = 0;
        
        stageMessageTypes.forEach((messageType) => {
          const credits = calculateCredits(messageType);
          const messageTotal = credits.sms + credits.email + credits.push;
          stageTotal += messageTotal;
          
          csvRows.push([
            messageType.type,
            messageType.frequency,
            messageType.channels.sms.enabled ? messageType.channels.sms.audienceSize : 'N/A',
            messageType.channels.email.enabled ? messageType.channels.email.audienceSize : 'N/A',
            messageType.channels.push.enabled ? messageType.channels.push.audienceSize : 'N/A',
            Math.round(credits.sms),
            Math.round(credits.email),
            Math.round(credits.push),
            Math.round(messageTotal)
          ]);
        });
        
        csvRows.push(['', '', '', '', '', '', '', 'Stage Total:', Math.round(stageTotal)]);
        csvRows.push(['']);
      }
    });
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(',')
    ).join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-calculation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const totals = getTotalCredits();
    const selectedStages = journeyStages.filter(stage => stage.selected);
    
    // Create Excel-friendly CSV with better formatting
    const csvRows = [];
    
    // Main summary section
    csvRows.push(['MONTHLY CREDIT CALCULATION SUMMARY']);
    csvRows.push(['Generated', new Date().toLocaleString()]);
    csvRows.push(['']);
    
    // Executive summary table
    csvRows.push(['EXECUTIVE SUMMARY']);
    csvRows.push(['Total Monthly SMS Credits', Math.round(totals.sms)]);
    csvRows.push(['Total Monthly Email Credits', Math.round(totals.email)]);
    csvRows.push(['Total Monthly Push Credits', Math.round(totals.push)]);
    csvRows.push(['TOTAL MONTHLY CREDITS REQUIRED', Math.round(totals.grand)]);
    csvRows.push(['']);
    
    // Credit rates reference
    csvRows.push(['CREDIT RATES (per message)']);
    csvRows.push(['SMS Rate', creditRates.sms]);
    csvRows.push(['Email Rate', creditRates.email]);
    csvRows.push(['Push Rate', creditRates.push]);
    csvRows.push(['']);
    
    // Detailed breakdown table
    csvRows.push(['DETAILED BREAKDOWN BY JOURNEY STAGE AND MESSAGE TYPE']);
    csvRows.push(['Journey Stage', 'Message Type', 'Frequency', 'SMS Audience', 'Email Audience', 'Push Audience', 
                 'SMS Monthly Credits', 'Email Monthly Credits', 'Push Monthly Credits', 'Total Monthly Credits']);
    
    selectedStages.forEach((stage) => {
      const stageMessageTypes = messageTypes.filter(mt => mt.journeyStageId === stage.id && mt.selected);
      
      if (stageMessageTypes.length > 0) {
        let isFirstRow = true;
        let stageTotal = 0;
        
        stageMessageTypes.forEach((messageType) => {
          const credits = calculateCredits(messageType);
          const messageTotal = credits.sms + credits.email + credits.push;
          stageTotal += messageTotal;
          
          csvRows.push([
            isFirstRow ? stage.name : '',
            messageType.type,
            messageType.frequency,
            messageType.channels.sms.enabled ? messageType.channels.sms.audienceSize : '',
            messageType.channels.email.enabled ? messageType.channels.email.audienceSize : '',
            messageType.channels.push.enabled ? messageType.channels.push.audienceSize : '',
            messageType.channels.sms.enabled ? Math.round(credits.sms) : '',
            messageType.channels.email.enabled ? Math.round(credits.email) : '',
            messageType.channels.push.enabled ? Math.round(credits.push) : '',
            Math.round(messageTotal)
          ]);
          isFirstRow = false;
        });
        
        // Stage subtotal
        csvRows.push(['', '', '', '', '', '', '', '', `${stage.name} Subtotal:`, Math.round(stageTotal)]);
      }
    });
    
    // Final total
    csvRows.push(['', '', '', '', '', '', '', '', 'GRAND TOTAL:', Math.round(totals.grand)]);
    
    // Convert to CSV
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        return cellStr.includes(',') || cellStr.includes('"') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr;
      }).join(',')
    ).join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-calculation-detailed-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTemplate = () => {
    const configName = prompt('Enter a name for this configuration:') || 'credit-calculator-config';
    
    // Create a configuration CSV with current selections
    const csvRows = [];
    
    // Header
    csvRows.push(['Credit Calculator Configuration']);
    csvRows.push(['Name:', configName]);
    csvRows.push(['Created:', new Date().toISOString()]);
    csvRows.push(['']);
    
    // Message configurations
    csvRows.push(['Journey Stage', 'Message Type', 'Frequency', 'Use This Message', 'SMS Audience', 'Email Audience', 'Push Audience']);
    
    // Group by journey stage for cleaner export
    journeyStageData.forEach(stage => {
      const stageMessages = messageTypes.filter(mt => mt.journeyStageId === stage.id && mt.selected);
      
      if (stageMessages.length > 0) {
        stageMessages.forEach((mt, index) => {
          csvRows.push([
            index === 0 ? stage.name : '', // Only show stage name on first message
            mt.type,
            mt.frequency,
            'TRUE',
            mt.channels.sms.audienceSize || '',
            mt.channels.email.audienceSize || '',
            mt.channels.push.audienceSize || ''
          ]);
        });
        csvRows.push(['']); // Empty row between stages
      }
    });
    
    // Convert to CSV
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        return cellStr.includes(',') || cellStr.includes('"') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr;
      }).join(',')
    ).join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${configName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBreakdown = () => {
    // Export journey stages and message types with audience counts
    const csvRows = [];
    
    // Header
    csvRows.push(['Credit Calculator - Message Breakdown']);
    csvRows.push(['Generated:', new Date().toISOString()]);
    csvRows.push(['']);
    
    // Headers
    csvRows.push(['Journey Stage', 'Message Type', 'Frequency', 'SMS Audience', 'Email Audience', 'Push Audience', 'SMS Credits', 'Email Credits', 'Push Credits', 'Total Credits']);
    
    // Group selected messages by journey stage
    journeyStageData.forEach(stage => {
      const stageMessages = messageTypes.filter(mt => mt.journeyStageId === stage.id && mt.selected);
      
      if (stageMessages.length > 0) {
        stageMessages.forEach((mt, index) => {
          const credits = calculateCredits(mt);
          csvRows.push([
            index === 0 ? stage.name : '', // Only show stage name on first message
            mt.type,
            mt.frequency,
            mt.channels.sms.audienceSize || 0,
            mt.channels.email.audienceSize || 0,
            mt.channels.push.audienceSize || 0,
            credits.sms.toFixed(2),
            credits.email.toFixed(2),
            credits.push.toFixed(2),
            (credits.sms + credits.email + credits.push).toFixed(2)
          ]);
        });
        csvRows.push(['']); // Empty row between stages
      }
    });
    
    // Totals
    const totals = getTotalCredits();
    csvRows.push(['']);
    csvRows.push(['TOTALS', '', '', '', '', '', totals.sms.toFixed(2), totals.email.toFixed(2), totals.push.toFixed(2), totals.grand.toFixed(2)]);
    
    // Convert to CSV
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        return cellStr.includes(',') || cellStr.includes('"') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr;
      }).join(',')
    ).join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-calculator-breakdown-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBlankTemplate = () => {
    // Create a blank template CSV that users can fill out
    const csvRows = [];
    
    // Header
    csvRows.push(['Credit Calculator Template']);
    csvRows.push(['Instructions: Fill out audience sizes and select message types to use']);
    csvRows.push(['']);
    
    // Message configurations only
    csvRows.push(['Journey Stage', 'Message Type', 'Frequency', 'Use This Message', 'SMS Audience', 'Email Audience', 'Push Audience']);
    csvRows.push(['Instructions:', 'Leave as-is', 'daily/weekly/monthly/quarterly', 'TRUE or FALSE', 'Enter number', 'Enter number', 'Enter number']);
    csvRows.push(['']);
    
    // Add all possible message types grouped by journey stage
    journeyStageData.forEach(stage => {
      stage.messageTypes.forEach((messageType, index) => {
        csvRows.push([
          index === 0 ? stage.name : '', // Only show stage name on first message type
          messageType,
          'monthly', // default frequency
          'FALSE', // default not selected
          '', // empty for user to fill
          '', 
          ''
        ]);
      });
      csvRows.push(['']); // Empty row between stages
    });
    
    // Convert to CSV
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        return cellStr.includes(',') || cellStr.includes('"') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr;
      }).join(',')
    ).join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-calculator-template-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportResults = () => {
    // Create CSV headers
    const headers = [
      'Journey Stage',
      'Message Type',
      'SMS Audience Size',
      'Email Audience Size',
      'Push Audience Size'
    ];

    // Create CSV rows - include ALL message types, not just selected ones
    const csvRows = [headers];

    messageTypes.forEach(mt => {
      const stage = journeyStageData.find(s => s.id === mt.journeyStageId);
      const stageName = stage ? stage.name : '';
      
      csvRows.push([
        stageName,
        mt.type,
        mt.channels.sms.audienceSize.toString(),
        mt.channels.email.audienceSize.toString(),
        mt.channels.push.audienceSize.toString()
      ]);
    });

    // Convert to CSV string
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        return cellStr.includes(',') || cellStr.includes('"') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr;
      }).join(',')
    ).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journey-credit-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportResults = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 2) {
          alert('CSV file appears to be empty or invalid.');
          return;
        }

        // Check if first line contains our expected headers
        const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
        const expectedHeaders = ['Journey Stage', 'Message Type', 'SMS Audience Size', 'Email Audience Size', 'Push Audience Size'];
        
        if (!expectedHeaders.every(h => headers.includes(h))) {
          alert('CSV file does not contain the expected headers. Please use an exported file or ensure headers match the expected format.');
          return;
        }

        // Parse data rows
        const newMessageTypes = [...messageTypes];
        let updatedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(',').map(cell => cell.replace(/^"|"$/g, '').trim());
          
          if (cells.length < 5) continue; // Skip incomplete rows
          
          const [stageName, messageType, smsAudience, emailAudience, pushAudience] = cells;
          
          if (!messageType) continue; // Skip rows without message type
          
          // Find corresponding message type in our data
          const existingMt = newMessageTypes.find(mt => {
            const stage = journeyStageData.find(s => s.id === mt.journeyStageId);
            return stage?.name === stageName && mt.type === messageType;
          });
          
          if (existingMt) {
            // Update audience sizes
            const smsSize = parseInt(smsAudience) || 0;
            const emailSize = parseInt(emailAudience) || 0;
            const pushSize = parseInt(pushAudience) || 0;
            
            existingMt.channels.sms.audienceSize = smsSize;
            existingMt.channels.email.audienceSize = emailSize;
            existingMt.channels.push.audienceSize = pushSize;
            
            // Update enabled status based on audience size > 0
            existingMt.channels.sms.enabled = smsSize > 0;
            existingMt.channels.email.enabled = emailSize > 0;
            existingMt.channels.push.enabled = pushSize > 0;
            
            // Mark as selected if any channel has audience > 0
            existingMt.selected = smsSize > 0 || emailSize > 0 || pushSize > 0;
            
            updatedCount++;
          }
        }
        
        // Update state
        setMessageTypes(newMessageTypes);
        
        // Update journey stages to be selected if they have selected message types
        setJourneyStages(prev => prev.map(stage => ({
          ...stage,
          selected: newMessageTypes.some(mt => mt.journeyStageId === stage.id && mt.selected)
        })));
        
        toast({
          title: "Import successful",
          description: `Updated ${updatedCount} message types with new data.`,
        });
        
      } catch (error) {
        console.error('Import error:', error);
        alert('Error reading CSV file. Please check the file format and try again.');
      }
    };
    input.click();
  };

  const handleReset = () => {
    setCreditRates({ sms: 1.00, email: 0.10, push: 0.05 });
    setChannelFilters({ sms: true, email: true, push: true });
    setJourneyStages(prev => prev.map(stage => ({ ...stage, selected: false })));
    setExpandedStages(new Set());
    // Reset message types to unselected but keep them initialized
    setMessageTypes(prev => prev.map(mt => ({ 
      ...mt, 
      selected: false,
      frequency: 'monthly',
      channels: {
        sms: { enabled: false, audienceSize: 0 },
        email: { enabled: false, audienceSize: 0 },
        push: { enabled: false, audienceSize: 0 }
      }
    })));
  };

  const totals = getTotalCredits();

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">Customer Journey Credit Calculator</h1>
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Lato, sans-serif', fontWeight: '400' }}>
                Calculate monthly credit requirements for multi-channel messaging campaigns across customer journey stages
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export / Import
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportResults}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportResults}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Results
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="relative group">
                <Button variant="ghost" size="sm">
                  <HelpCircle className="h-4 w-4" />
                </Button>
                <div className="absolute right-0 top-10 w-96 bg-gray-900 text-white text-sm rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="space-y-2">
                    <p className="font-semibold">How to use this calculator:</p>
                    <p>1. Set your credit rates for SMS, Email, and Push</p>
                    <p>2. Select journey stages and message types</p>
                    <p>3. Configure audience sizes for each channel</p>
                    <p>4. Use checkboxes to filter specific channels</p>
                    
                    <div className="pt-2 border-t border-gray-700">
                      <p className="font-semibold">Export/Import:</p>
                      <p>• Export creates a CSV with all message types</p>
                      <p>• Modify the CSV in Excel or similar programs</p>
                      <p className="text-yellow-300">• MUST export first - import requires the same file structure</p>
                      <p>• Import updates calculator with your changes</p>
                    </div>
                  </div>
                  <div className="absolute top-[-6px] right-4 w-3 h-3 bg-gray-900 rotate-45"></div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-primary-500 hover:bg-primary-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportBlankTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Blank Template for Completion
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Current Message Configuration
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportBreakdown}>
                    <Download className="h-4 w-4 mr-2" />
                    Message Breakdown with Credits
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Detailed Credit Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Simple Credit Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Row: Credit Configuration - Full Width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <ConfigurationPanel
              creditRates={creditRates}
              onCreditRatesChange={setCreditRates}
              channelFilters={channelFilters}
              onChannelFiltersChange={setChannelFilters}
              totals={totals}
            />
          </div>

          {/* Bottom Row: Journey Stage Selection and Message Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Journey Stage Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
              <JourneyStageSelector
                journeyStages={journeyStages}
                messageTypes={messageTypes}
                onMessageTypeToggle={handleMessageTypeToggle}
                onExpandedStagesChange={setExpandedStages}
                expandedStages={expandedStages}
              />
            </div>

            {/* Right Column: Message Type Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
              <MessageTypeConfigurator
                journeyStages={journeyStages}
                messageTypes={messageTypes}
                onUpdateMessageType={handleUpdateMessageType}
                calculateCredits={calculateCredits}
                expandedStages={expandedStages}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Breakdown Modal */}
      <BreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        journeyStages={journeyStages}
        messageTypes={messageTypes}
        calculateCredits={calculateCredits}
        totals={totals}
      />
    </div>
  );
}
